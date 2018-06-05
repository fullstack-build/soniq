export interface ITableMigrationExtensions {
    [name: string]: (extensionDefinition, sqlMigrationObj, nodeSqlObj, schemaName, tableNameDown, tableNameUp) => void;
}
