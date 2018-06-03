import { ITableMigrationExtensions } from './ITableMigrationExtensions';

// object with all directive parser
const tableMigrationExtensions: ITableMigrationExtensions = {};

export function registerTableMigrationExtension(extensionNameInLowerCase: string, fn: (extensionDefinitionWithAction,
                                                                                       nodeSqlObj,
                                                                                       schemaName,
                                                                                       tableNameDown,
                                                                                       tableNameUp) => void): void {
  tableMigrationExtensions[extensionNameInLowerCase] = fn;
}

// return currently registered parser
export function getTableMigrationExtension(extensionName?: string): ITableMigrationExtensions | any {
  return (extensionName != null) ? tableMigrationExtensions[extensionName] : tableMigrationExtensions;
}
