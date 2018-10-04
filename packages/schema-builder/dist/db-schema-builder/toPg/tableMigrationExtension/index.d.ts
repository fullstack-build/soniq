import { ITableMigrationExtensions } from "./ITableMigrationExtensions";
export declare function registerTableMigrationExtension(
  extensionNameInLowerCase: string,
  fn: (extensionDefinitionWithAction: any, sqlMigrationObj: any, nodeSqlObj: any, schemaName: any, tableNameDown: any, tableNameUp: any) => void
): void;
export declare function getTableMigrationExtension(extensionName?: string): ITableMigrationExtensions | any;
