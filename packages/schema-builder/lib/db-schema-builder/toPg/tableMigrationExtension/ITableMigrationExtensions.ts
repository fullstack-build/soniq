export interface ITableMigrationExtensions {
  [name: string]: (extensionDefinition,
                   nodeSqlObj,
                   schemaName,
                   tableNameDown,
                   tableNameUp) => void;
}
