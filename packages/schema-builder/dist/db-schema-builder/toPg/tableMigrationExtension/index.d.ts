import { ITableMigrationExtensions } from './ITableMigrationExtensions';
export declare function registerTableMigrationExtension(extensionNameInLowerCase: string, fn: (extensionDefinitionWithAction, sqlMigrationObj, nodeSqlObj, schemaName, tableNameDown, tableNameUp) => void): void;
export declare function getTableMigrationExtension(extensionName?: string): ITableMigrationExtensions | any;
