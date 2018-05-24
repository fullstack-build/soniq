import { IDbMeta } from './IDbMeta';
export declare class PgToDbMeta {
    private readonly DELETED_PREFIX;
    private dbAppClient;
    private readonly dbMeta;
    constructor(dbAppClient?: any);
    getPgDbMeta(): Promise<IDbMeta>;
    private iterateAndAddSchemas();
    private iterateEnumTypes(schemaName);
    private iterateAndAddTables(schemaName);
    private iterateAndAddColumns(schemaName, tableName);
    private iterateAndAddConstraints(schemaName, tableName);
    private addConstraint(constraintType, constraintRow, refDbMetaCurrentTable);
    private addCheck(constraintRow, refDbMetaCurrentTable);
    private iterateAndAddTriggers(schemaName, tableName);
    private relationBuilderHelper(constraint);
    private manyToManyRelationBuilderHelper(columnDescribingRelation, schemaName, tableName, mtmPayload);
    private getAuthSettings();
    private getFileFieldSettings();
}
