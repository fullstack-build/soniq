import { IColumnMigrationExtensions } from "./IColumnMigrationExtensions";
export declare function registerColumnMigrationExtension(extensionNameInLowerCase: string, fn: (extensionDefinitionWithAction: any, sqlMigrationObj: any, nodeSqlObj: any, schemaName: any, tableName: any, columnName: any) => void): void;
export declare function getColumnMigrationExtension(extensionName?: string): IColumnMigrationExtensions | any;
