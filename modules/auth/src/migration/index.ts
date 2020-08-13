import { generateAuthSchema } from "./basic";
import { GraphQl, IDbSchema, IGraphqlAppConfig } from "@soniq/graphql";
import { PoolClient, OPERATION_SORT_POSITION, IModuleMigrationResult, IMigrationError } from "soniq";
import { Migration } from "@soniq/graphql/src/migration/Migration";
import { IPgSettings, IAuthApplicationConfig } from "../interfaces";
import { ConfigMergeHelper } from "./ConfigMergeHelper";
import { defaultConfig } from "./defaultConfig";

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
  appConfig: IAuthApplicationConfig,
  pgClient: PoolClient,
  authFactorProviders: string
): Promise<IModuleMigrationResult> {
  const authSchema: IDbSchema = await generateAuthSchema();

  const authSchemaAppConfig: IGraphqlAppConfig = {
    schema: authSchema,
    options: {},
  };

  const gqlMigration: Migration = graphQl.getMigration();

  const result: IModuleMigrationResult = await gqlMigration.generateSchemaMigrationCommands(
    authSchemaAppConfig,
    pgClient
  );

  const { runtimeConfig, errors } = ConfigMergeHelper.merge(defaultConfig, appConfig);

  errors.forEach((error: IMigrationError) => {
    result.errors.push(error);
  });

  runtimeConfig.pgConfig.auth_factor_providers = authFactorProviders;

  const currentSettings: { [key: string]: unknown } = await getCurrentSettings(pgClient);
  const sqls: string[] = [];

  Object.keys(runtimeConfig.pgConfig).forEach((key) => {
    if (currentSettings[key] == null) {
      sqls.push(
        `INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${key}$tok$, $tok$${runtimeConfig.pgConfig[key]}$tok$);`
      );
    } else {
      // TODO: I disabled this, because I am not sure if I did use != instead of !== on purpose
      // eslint-disable-next-line eqeqeq
      if (runtimeConfig.pgConfig[key] != null && runtimeConfig.pgConfig[key] != currentSettings[key]) {
        sqls.push(
          `UPDATE _auth."Settings" SET "value"=$tok$${runtimeConfig.pgConfig[key]}$tok$ WHERE "key"=$tok$${key}$tok$;`
        );
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

  result.moduleRuntimeConfig = JSON.parse(JSON.stringify(runtimeConfig));
  result.moduleRuntimeConfig.pgConfig = null;
  delete result.moduleRuntimeConfig.pgConfig;

  return result;
}
