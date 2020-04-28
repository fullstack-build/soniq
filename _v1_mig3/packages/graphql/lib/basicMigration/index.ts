import { generateGraphqlMetaSchema } from "./basic";
import { GraphQl } from "../";
import { IModuleAppConfig, IModuleEnvConfig, PoolClient, OPERATION_SORT_POSITION } from "@fullstack-one/core";

export async function migrate(graphQl: GraphQl, appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient) {
  const authSchema = await generateGraphqlMetaSchema();

  const gqlMigration = graphQl.getMigration();

  const result = await gqlMigration.generateSchemaMigrationCommands(authSchema, {}, pgClient);

  return result;
}
