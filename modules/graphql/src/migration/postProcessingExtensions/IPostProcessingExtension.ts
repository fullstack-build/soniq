import { IGqlMigrationResult, IGqlMigrationContext } from "../interfaces";
import { PoolClient } from "soniq";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";
import { IGraphqlAppConfig } from "../../moduleDefinition/interfaces";

export interface IPostProcessingExtension {
  generateCommands: (
    appConfig: IGraphqlAppConfig,
    dbClient: PoolClient,
    helpers: IHelpers,
    gqlMigrationContext: IGqlMigrationContext,
    result: IGqlMigrationResult
  ) => Promise<IGqlMigrationResult>;
}
