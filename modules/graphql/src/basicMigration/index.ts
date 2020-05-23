import { generateGraphqlMetaSchema } from "./basic";
import { GraphQl } from "../index";
import { PoolClient, IModuleMigrationResult } from "soniq";
import { IDbSchema } from "../migration/DbSchemaInterface";
import { Migration } from "../migration/Migration";
import { IGraphqlAppConfig } from "../moduleDefinition/interfaces";

export async function migrate(
  graphQl: GraphQl,
  appConfig: IGraphqlAppConfig,
  pgClient: PoolClient
): Promise<IModuleMigrationResult> {
  const graphqlSchema: IDbSchema = await generateGraphqlMetaSchema();

  const graphqlInternAppConfig: IGraphqlAppConfig = {
    schema: graphqlSchema,
    options: appConfig.options,
  };

  const gqlMigration: Migration = graphQl.getMigration();

  const result: IModuleMigrationResult = await gqlMigration.generateSchemaMigrationCommands(
    graphqlInternAppConfig,
    pgClient
  );

  return result;
}
