import { Config } from '@fullstack-one/config';
import { LoggerFactory } from '@fullstack-one/logger';
import { IDbMeta, DbAppClient } from '@fullstack-one/db';
export declare class Migration {
    private fromDbMeta;
    private toDbMeta;
    private migrationObject;
    private dbAppClient;
    private initSqlPaths;
    private logger;
    constructor(config?: Config, loggerFactory?: LoggerFactory, dbAppClient?: DbAppClient);
    addMigrationPath(path: string): void;
    getMigrationDbMeta(): IDbMeta;
    initDb(): Promise<void>;
    getMigrationSqlStatements(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, renameInsteadOfDrop?: boolean): string[];
    getViewsSql(): any[];
    getBootSql(): any[];
    migrate(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, renameInsteadOfDrop?: boolean): Promise<void>;
}
