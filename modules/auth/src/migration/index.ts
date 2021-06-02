import { generateAuthSchema } from "./basic";
import { GraphQl, IDbSchema } from "@soniq/graphql";
import { PoolClient, OPERATION_SORT_POSITION, IModuleMigrationResult } from "soniq";
import { Migration } from "@soniq/graphql/src/migration/Migration";
import { IPgSettings } from "../interfaces";
import { IAuthAppConfig, IPgConfigFinal } from "../moduleDefinition/interfaces";

const requiredSecrets: string[] = [
  "access_token_secret",
  "hash_secret",
  "refresh_token_secret",
  "transaction_token_secret",
];

const EXISTS_QUERY: string = `
SELECT EXISTS (
   SELECT 1
	   FROM   information_schema.tables 
	   WHERE  table_schema = '_auth'
	   AND    table_name = 'Settings'
   ) "exists";
`;

async function doesSettingsTableExist(pgClient: PoolClient): Promise<boolean> {
  const { rows } = await pgClient.query(EXISTS_QUERY);

  return rows[0] != null && rows[0].exists != null && rows[0].exists === true;
}

async function getCurrentSettings(pgClient: PoolClient): Promise<IPgSettings> {
  const settingsTableExists: boolean = await doesSettingsTableExist(pgClient);
  const settings: IPgSettings = {};

  if (settingsTableExists) {
    const { rows } = await pgClient.query(`SELECT key, value FROM _auth."Settings";`);

    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
  }

  return settings;
}

export async function migrate(
  graphQl: GraphQl,
  appConfig: IAuthAppConfig,
  pgClient: PoolClient,
  authFactorProviders: string
): Promise<IModuleMigrationResult> {
  const authSchema: IDbSchema = await generateAuthSchema();

  const gqlMigration: Migration = graphQl.getMigration();

  const result: IModuleMigrationResult = await gqlMigration.generateSchemaMigrationCommands(authSchema, pgClient);

  const pgConfig: IPgConfigFinal = appConfig.pgConfig as IPgConfigFinal;
  pgConfig.auth_factor_providers = authFactorProviders;
  pgConfig.admin_token_secret = appConfig.secrets.admin;
  pgConfig.root_token_secret = appConfig.secrets.root;

  const currentSettings: { [key: string]: unknown } = await getCurrentSettings(pgClient);
  const sqls: string[] = [];

  Object.keys(pgConfig).forEach((key) => {
    if (currentSettings[key] == null) {
      sqls.push(`INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${key}$tok$, $tok$${pgConfig[key]}$tok$);`);
    } else {
      // TODO: I disabled this, because I am not sure if I did use != instead of !== on purpose
      // eslint-disable-next-line eqeqeq
      if (pgConfig[key] != null && pgConfig[key] != currentSettings[key]) {
        sqls.push(`UPDATE _auth."Settings" SET "value"=$tok$${pgConfig[key]}$tok$ WHERE "key"=$tok$${key}$tok$;`);
      }
    }
  });

  requiredSecrets.forEach((key) => {
    if (currentSettings[key] == null) {
      sqls.push(
        `INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${key}$tok$, SUBSTRING(crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 4)), 8, 21));`
      );
    }
  });

  if (currentSettings.transaction_token_timestamp == null) {
    sqls.push(`INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${"transaction_token_timestamp"}$tok$, 0);`);
  }

  if (sqls.length > 0) {
    result.commands.push({
      sqls,
      operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
    });
  }

  return result;
}
