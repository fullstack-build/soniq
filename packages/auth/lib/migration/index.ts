import { generateAuthSchema } from "./basic";
import { GraphQl } from "@fullstack-one/graphql";
import { IModuleAppConfig, IModuleEnvConfig, PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";

const defaultSettings = {
  access_token_bf_iter_count: "4",
  access_token_max_age_in_seconds: "1209600",
  access_token_secret: "geheim",
  admin_token_secret: "boss",
  auth_factor_providers: "password:email:facebook",
  get_tenant_by_user_id_query: `SELECT 'default' "tenantId";`,
  hash_bf_iter_count: "6",
  hash_secret: "gehtdichnixan",
  refresh_token_bf_iter_count: "6",
  refresh_token_secret: "ThisIsSparta",
  transaction_token_max_age_in_seconds: "86400",
  transaction_token_secret: "$2a$04$G6winEQvL4s7kTk8GJ9tq.w3.N3N6bQkm5KDQ.kmQvyMIfBqfh43q",
  transaction_token_timestamp: "1554743124"
};

export async function migrate(graphQl: GraphQl, appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient) {
  const authSchema = await generateAuthSchema();

  const gqlMigration = graphQl.getMigration();

  const result = await gqlMigration.generateSchemaMigrationCommands(authSchema, {}, pgClient);

  const currentSettings = await getCurrentSettings(pgClient);
  const sqls: string[] = [];

  Object.keys(defaultSettings).forEach((key) => {
    if (currentSettings[key] == null) {
      if (envConfig[key] != null) {
        sqls.push(`INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${key}$tok$, $tok$${envConfig[key]}$tok$);`);
      } else {
        sqls.push(`INSERT INTO _auth."Settings"("key", "value") VALUES($tok$${key}$tok$, $tok$${defaultSettings[key]}$tok$);`);
      }
    } else {
      if (envConfig[key] != null && envConfig[key] !== currentSettings[key]) {
        sqls.push(`UPDATE _auth."Settings" SET "value"=$tok$${envConfig[key]}$tok$ WHERE "key"=$tok$${key}$tok$;`);
      }
    }
  });

  if (sqls.length > 0) {
    result.commands.push({
      sqls,
      operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA
    });
  }

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
