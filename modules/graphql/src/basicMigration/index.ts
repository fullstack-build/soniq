import { generateGraphqlMetaSchema } from "./basic";
import { GraphQl } from "../index";
import { IModuleAppConfig, IModuleEnvConfig, PoolClient, IModuleMigrationResult } from "soniq";
import { IDbSchema } from "../migration/DbSchemaInterface";
import { Migration } from "../migration/Migration";

export async function migrate(
  graphQl: GraphQl,
  appConfig: IModuleAppConfig,
  envConfig: IModuleEnvConfig,
  pgClient: PoolClient
): Promise<IModuleMigrationResult> {
  const authSchema: IDbSchema = await generateGraphqlMetaSchema();

  const gqlMigration: Migration = graphQl.getMigration();

  const result: IModuleMigrationResult = await gqlMigration.generateSchemaMigrationCommands(authSchema, {}, pgClient);

  return result;
}
