import { IGqlMigrationResult, IGqlMigrationContext } from "../interfaces";
import { PoolClient } from "soniq";
import { IColumnExtension } from "../columnExtensions/IColumnExtension";
import { ITableExtension } from "../tableExtensions/ITableExtension";
import { IGraphqlAppConfig } from "../../moduleDefinition/interfaces";

export interface ISchemaExtension {
  generateCommands: (
    appConfig: IGraphqlAppConfig,
    dbClient: PoolClient,
    helpers: IHelpers,
    gqlMigrationContext: IGqlMigrationContext
  ) => Promise<IGqlMigrationResult>;
}

export interface IHelpers {
  getColumnExtensionByType: (type: string) => IColumnExtension | null;
  getTableExtensions: () => ITableExtension[];
  validateId: (id: string) => string | null;
}
