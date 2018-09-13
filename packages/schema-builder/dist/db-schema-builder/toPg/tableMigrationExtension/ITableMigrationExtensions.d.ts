export interface ITableMigrationExtensions {
    [name: string]: (extensionDefinition: any, sqlMigrationObj: any, nodeSqlObj: any, schemaName: any, tableNameDown: any, tableNameUp: any) => void;
}
