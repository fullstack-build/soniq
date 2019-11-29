import { generateAuthSchema } from "./basic";
import { GraphQl } from "@fullstack-one/graphql";
import { IModuleAppConfig, IModuleEnvConfig, PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";
import { ConfigMergeHelper } from "./ConfigMergeHelper";

const requiredSecrets = ["access_token_secret", "hash_secret", "refresh_token_secret", "transaction_token_secret"];

export async function migrate(graphQl: GraphQl, appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient) {
  const authSchema = await generateAuthSchema();

  const gqlMigration = graphQl.getMigration();

  const result = await gqlMigration.generateSchemaMigrationCommands(authSchema, {}, pgClient);

  const { runtimeConfig, errors } = ConfigMergeHelper.merge(appConfig, envConfig);

  errors.forEach((error) => {
    result.errors.push(error);
  });

  const currentSettings = await getCurrentSettings(pgClient);
  const sqls: string[] = [];

  Object.keys(runtimeConfig.pgConfig).forEach((key) => {
    if (currentSettings[key] == null) {
      sqls.push(`INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${key}$tok$, $tok$${runtimeConfig.pgConfig[key]}$tok$);`);
    } else {
      if (runtimeConfig.pgConfig[key] != null && runtimeConfig.pgConfig[key] != currentSettings[key]) {
        sqls.push(`UPDATE _auth."Settings" SET "value"=$tok$${runtimeConfig.pgConfig[key]}$tok$ WHERE "key"=$tok$${key}$tok$;`);
      }
    }
  });

  requiredSecrets.forEach((key) => {
    if (currentSettings[key] == null) {
      sqls.push(`INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${key}$tok$, SUBSTRING(crypt(encode(gen_random_bytes(64), 'hex'), gen_salt('bf', 4)), 8, 21));`);
    }
  });

  if (currentSettings["transaction_token_timestamp"] == null) {
    sqls.push(`INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${"transaction_token_timestamp"}$tok$, 0);`);
  }

  if (sqls.length > 0) {
    result.commands.push({
      sqls,
      operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA
    });
  }

  result.moduleRuntimeConfig = JSON.parse(JSON.stringify(runtimeConfig));
  result.moduleRuntimeConfig.pgConfig = null;
  delete result.moduleRuntimeConfig.pgConfig;

  return result;
}

async function getCurrentSettings(pgClient: PoolClient): Promise<any> {
  const settingsTableExists = await doesSettingsTableExist(pgClient);
  const settings = {};

  if (settingsTableExists) {
    const { rows } = await pgClient.query(`SELECT key, value FROM _auth."Settings";`);

    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
  }

  return settings;
}

const EXISTS_QUERY = `
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
