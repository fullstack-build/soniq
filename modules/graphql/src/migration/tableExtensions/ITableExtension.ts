/* eslint-disable @typescript-eslint/no-explicit-any */
import { IDbSchema, IDbTable, IDbColumn } from "../DbSchemaInterface";
import { ITableMeta, IGqlMigrationResult, IGqlMigrationContext } from "../interfaces";
import { PoolClient } from "soniq";
import { IColumnExtension } from "../columnExtensions/IColumnExtension";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";

export interface ITableExtensionData {
  table_name: string;
  table_schema: string;
  [key: string]: any;
}

export interface ITableExtension {
  preloadData?: (
    schema: IDbSchema,
    dbClient: PoolClient,
    gqlMigrationContext: IGqlMigrationContext
  ) => Promise<ITableExtensionData[]>;
  generateCommands: (
    table: IDbTable,
    schema: IDbSchema,
    extensionData: any[], // ITableExtensionData
    helpers: IHelpersWithColumnHelper,
    dbClient: PoolClient,
    gqlMigrationContext: IGqlMigrationContext
  ) => Promise<IGqlMigrationResult>;
  cleanUpDeletedTable?: (
    schema: IDbSchema,
    tableMeta: ITableMeta,
    extensionData: any[], //ITableExtensionData
    helpers: IHelpers,
    dbClient: PoolClient,
    gqlMigrationContext: IGqlMigrationContext
  ) => Promise<IGqlMigrationResult>;
}

export interface IHelpersWithColumnHelper extends IHelpers {
  getColumnDataByColumnId: (columnId: string) => IColumnData | null;
}

export interface IColumnData {
  schema: IDbSchema;
  table: IDbTable;
  column: IDbColumn;
  columnExtension: IColumnExtension;
}
