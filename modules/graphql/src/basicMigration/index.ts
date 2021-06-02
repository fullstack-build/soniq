import { generateGraphqlMetaSchema } from "./basic";
import { GraphQl } from "../index";
import { PoolClient, IModuleMigrationResult } from "soniq";
import { IDbSchema } from "../migration/DbSchemaInterface";
import { Migration } from "../migration/Migration";

export async function migrate(graphQl: GraphQl, pgClient: PoolClient): Promise<IModuleMigrationResult> {
  const graphqlSchema: IDbSchema = await generateGraphqlMetaSchema();

  const gqlMigration: Migration = graphQl.getMigration();

  const result: IModuleMigrationResult = await gqlMigration.generateSchemaMigrationCommands(graphqlSchema, pgClient);

  return result;
}
