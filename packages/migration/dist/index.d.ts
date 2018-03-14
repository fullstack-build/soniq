import { Config } from '@fullstack-one/config';
import { LoggerFactory } from '@fullstack-one/logger';
import { IDbMeta, DbAppClient } from '@fullstack-one/db';
export declare class Migration {
    private readonly fromDbMeta;
    private readonly toDbMeta;
    private readonly migrationObject;
    private dbAppClient;
    private logger;
    constructor(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, config?: Config, loggerFactory?: LoggerFactory, dbAppClient?: DbAppClient);
    getMigrationDbMeta(): IDbMeta;
    initDb(): Promise<void>;
    getMigrationSqlStatements(renameInsteadOfDrop?: boolean): string[];
    getViewsSql(): any[];
    getBootSql(): any[];
    migrate(renameInsteadOfDrop?: boolean): Promise<void>;
}
