import { IMigrationSqlObj } from "../IMigrationSqlObj";
import { IDbRelation } from "../IDbMeta";
import { MigrationObject } from "../migrationObject";
export { registerTableMigrationExtension } from "./tableMigrationExtension";
export { registerColumnMigrationExtension } from "./columnMigrationExtension";
export declare class SqlObjFromMigrationObject {
    private readonly ACTION_KEY;
    private readonly DELETED_PREFIX;
    private readonly schemasToIgnore;
    private readonly isRenameInsteadOfDrop;
    private readonly fromDbMeta;
    private readonly toDbMeta;
    private readonly migrationObj;
    readonly sqlStatements: string[];
    constructor(migrationObject: MigrationObject, isRenameInsteadOfDrop?: boolean);
    private splitActionFromNode;
    private sqlMigrationObjToSqlStatements;
    private createEmptySqlObj;
    createSqlObjFromMigrationDbMeta(): IMigrationSqlObj;
    createSqlForEnumObject(sqlMigrationObj: any, enumTypeName: any, enumTypeValue: any): void;
    createSqlFromSchemaObject(sqlMigrationObj: any, schemaName: string, schemDefinition: any): void;
    createSqlFromTableObject(sqlMigrationObj: any, schemaName: any, tableName: any, tableDefinition: any): void;
    createSqlFromColumnObject(sqlMigrationObj: any, schemaName: any, tableName: any, columnName: any, columnDefinition: any): void;
    createSqlFromConstraintObject(sqlMigrationObj: any, schemaName: any, tableName: any, constraintName: any, constraintObject: any): void;
    createRelation(sqlMigrationObj: any, relationName: any, relationObject: IDbRelation[]): void;
    createSqlManyToManyRelation(sqlMigrationObj: any, relationName: any, relationObject: IDbRelation[]): void;
}
