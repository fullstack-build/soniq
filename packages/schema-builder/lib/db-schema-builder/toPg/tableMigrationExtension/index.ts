import { ITableMigrationExtensions } from "./ITableMigrationExtensions";

const tableMigrationExtensions: ITableMigrationExtensions = {};
export function registerTableMigrationExtension(
  extensionNameInLowerCase: string,
  fn: (extensionDefinitionWithAction, sqlMigrationObj, nodeSqlObj, schemaName, tableNameDown, tableNameUp) => void
): void {
  tableMigrationExtensions[extensionNameInLowerCase] = fn;
}

export function getTableMigrationExtension(extensionName?: string): ITableMigrationExtensions | any {
  return extensionName != null ? tableMigrationExtensions[extensionName] : tableMigrationExtensions;
}
