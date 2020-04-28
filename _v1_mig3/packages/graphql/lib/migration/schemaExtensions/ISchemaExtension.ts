import { IDbSchema, IDbTable, IDbColumn } from "../DbSchemaInterface";
import { IGqlMigrationResult } from "../interfaces";
import { PoolClient } from "@fullstack-one/core";
import { IColumnExtension } from "../columnExtensions/IColumnExtension";
import { ITableExtension } from "../tableExtensions/ITableExtension";

export interface ISchemaExtension {
  generateCommands: (schema: IDbSchema, dbClient: PoolClient, helpers: IHelpers, gqlMigrationContext: any) => Promise<IGqlMigrationResult>;
}

export interface IHelpers {
  getColumnExtensionByType: (type: string) => IColumnExtension;
  getTableExtensions: () => ITableExtension[];
  validateId: (id: string) => string | null;
}
