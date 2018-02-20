import * as ONE from 'fullstack-one';
export declare class Migration {
    private readonly fromDbMeta;
    private readonly toDbMeta;
    private readonly migrationObject;
    private logger;
    constructor(fromDbMeta: ONE.IDbMeta, toDbMeta: ONE.IDbMeta);
    getMigrationDbMeta(): ONE.IDbMeta;
    initDb(): Promise<void>;
    getMigrationSqlStatements(renameInsteadOfDrop?: boolean): string[];
    getViewsSql(): any[];
    getBootSql(): any[];
    migrate(renameInsteadOfDrop?: boolean): Promise<void>;
}
