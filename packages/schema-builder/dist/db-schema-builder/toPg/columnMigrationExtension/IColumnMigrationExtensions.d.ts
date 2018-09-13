export interface IColumnMigrationExtensions {
    [name: string]: (extensionDefinition, sqlMigrationObj, nodeSqlObj, schemaName, tableNameDown, tableNameUp) => void;
}
