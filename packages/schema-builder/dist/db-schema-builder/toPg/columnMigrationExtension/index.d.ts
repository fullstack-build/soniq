import { IColumnMigrationExtensions } from './IColumnMigrationExtensions';
export declare function registerColumnMigrationExtension(extensionNameInLowerCase: string, fn: (extensionDefinitionWithAction, sqlMigrationObj, nodeSqlObj, schemaName, tableName, columnName) => void): void;
export declare function getColumnMigrationExtension(extensionName?: string): IColumnMigrationExtensions | any;
