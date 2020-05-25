import { IDbSchema } from "../DbSchemaInterface";
import { IGqlMigrationResult } from "../interfaces";
import { PoolClient } from "@fullstack-one/core";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";

export interface IPostProcessingExtension {
  generateCommands: (
    schema: IDbSchema,
    dbClient: PoolClient,
    helpers: IHelpers,
    gqlMigrationContext: any,
    result: IGqlMigrationResult
  ) => Promise<IGqlMigrationResult>;
}
