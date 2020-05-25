import { generateFileStorageSchema } from "./basic";
import { GraphQl } from "@fullstack-one/graphql";
import { IModuleAppConfig, IModuleEnvConfig, PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";
import { ConfigMergeHelper } from "./ConfigMergeHelper";

export async function migrate(graphQl: GraphQl, appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient) {
  const fileStorageSchema = await generateFileStorageSchema();

  const gqlMigration = graphQl.getMigration();

  const result = await gqlMigration.generateSchemaMigrationCommands(fileStorageSchema, {}, pgClient);

  const { runtimeConfig, errors } = ConfigMergeHelper.merge(appConfig, envConfig);

  errors.forEach((error) => {
    result.errors.push(error);
  });

  const currentSettings = await getCurrentSettings(pgClient);
  const sqls: string[] = [];

  Object.keys(runtimeConfig.pgConfig).forEach((key) => {
    if (currentSettings[key] == null) {
      sqls.push(`INSERT INTO _file_storage."Settings"("key", "value") VALUES($tok$${key}$tok$, $tok$${runtimeConfig.pgConfig[key]}$tok$);`);
    } else {
      if (runtimeConfig.pgConfig[key] != null && runtimeConfig.pgConfig[key] != currentSettings[key]) {
        sqls.push(`UPDATE _file_storage."Settings" SET "value"=$tok$${runtimeConfig.pgConfig[key]}$tok$ WHERE "key"=$tok$${key}$tok$;`);
      }
    }
  });

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
    const { rows } = await pgClient.query(`SELECT key, value FROM _file_storage."Settings";`);

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
	   WHERE  table_schema = '_file_storage'
	   AND    table_name = 'Settings'
   ) "exists";
`;

async function doesSettingsTableExist(pgClient: PoolClient): Promise<boolean> {
  const { rows } = await pgClient.query(EXISTS_QUERY);

  return rows[0] != null && rows[0].exists != null && rows[0].exists === true;
}
