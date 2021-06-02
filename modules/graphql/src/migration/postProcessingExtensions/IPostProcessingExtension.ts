import { IGqlMigrationResult, IGqlMigrationContext } from "../interfaces";
import { PoolClient } from "soniq";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { IDbSchema } from "../DbSchemaInterface";

export interface IPostProcessingExtension {
  generateCommands: (
    schema: IDbSchema,
    dbClient: PoolClient,
    helpers: IHelpers,
    gqlMigrationContext: IGqlMigrationContext,
    result: IGqlMigrationResult
  ) => Promise<IGqlMigrationResult>;
}
