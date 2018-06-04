import { IColumnMigrationExtensions } from './IColumnMigrationExtensions';

const columnMigrationExtensions: IColumnMigrationExtensions = {};
export function registerColumnMigrationExtension(extensionNameInLowerCase: string, fn: (extensionDefinitionWithAction,
                                                                                        nodeSqlObj,
                                                                                        schemaName,
                                                                                        tableName,
                                                                                        columnName) => void): void {
  columnMigrationExtensions[extensionNameInLowerCase] = fn;
}

export function getColumnMigrationExtension(extensionName?: string): IColumnMigrationExtensions | any {
  return (extensionName != null) ? columnMigrationExtensions[extensionName] : columnMigrationExtensions;
}
