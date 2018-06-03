export interface IColumnMigrationExtensions {
  [name: string]: (extensionDefinition,
                   nodeSqlObj,
                   schemaName,
                   tableNameDown,
                   tableNameUp) => void;
}
