import { IDbMeta } from '@fullstack-one/db';
export declare class Migration {
    private readonly fromDbMeta;
    private readonly toDbMeta;
    private readonly migrationObject;
    private logger;
    constructor(fromDbMeta: IDbMeta, toDbMeta: IDbMeta);
    getMigrationDbMeta(): IDbMeta;
    initDb(): Promise<void>;
    getMigrationSqlStatements(renameInsteadOfDrop?: boolean): string[];
    getViewsSql(): any[];
    getBootSql(): any[];
    migrate(renameInsteadOfDrop?: boolean): Promise<void>;
}
