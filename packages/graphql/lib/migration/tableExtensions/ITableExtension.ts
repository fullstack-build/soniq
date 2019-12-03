import { IDbSchema, IDbTable, IDbColumn } from "../DbSchemaInterface";
import { ITableMeta, IGqlMigrationResult } from "../interfaces";
import { PoolClient } from "@fullstack-one/core";
import { IColumnExtension } from "../columnExtensions/IColumnExtension";
import { IHelpers } from "../schemaExtensions/ISchemaExtension";

export interface ITableExtensionData {
  table_name: string;
  table_schema: string;
  [key: string]: any;
}

export interface ITableExtension {
  preloadData?: (schema: IDbSchema, dbClient: PoolClient, gqlMigrationContext: any) => Promise<ITableExtensionData[]>;
  generateCommands: (
    table: IDbTable,
    schema: IDbSchema,
    extensionData: ITableExtensionData[],
    helpers: IHelpersWithColumnHelper,
    dbClient: PoolClient,
    gqlMigrationContext: any
  ) => Promise<IGqlMigrationResult>;
  cleanUpDeletedTable?: (
    schema: IDbSchema,
    tableMeta: ITableMeta,
    extensionData: ITableExtensionData[],
    helpers: IHelpers,
    dbClient: PoolClient,
    gqlMigrationContext: any
  ) => Promise<IGqlMigrationResult>;
}

export interface IHelpersWithColumnHelper extends IHelpers {
  getColumnDataByColumnId: (columnId: string) => IColumnData;
}

export interface IColumnData {
  schema: IDbSchema;
  table: IDbTable;
  column: IDbColumn;
  columnExtension: IColumnExtension;
}
