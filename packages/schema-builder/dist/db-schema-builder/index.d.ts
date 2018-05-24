import { Config } from '@fullstack-one/config';
import { LoggerFactory } from '@fullstack-one/logger';
import { DbAppClient } from '@fullstack-one/db';
import { IDbMeta } from './pg/IDbMeta';
export declare class DbSchemaBuilder {
    private fromDbMeta;
    private toDbMeta;
    private migrationObject;
    private dbAppClient;
    private initSqlPaths;
    private directiveParser;
    private logger;
    constructor(config?: Config, loggerFactory?: LoggerFactory, dbAppClient?: DbAppClient);
    registerDirectiveParser(nameInLowerCase: string, fn: (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => void): void;
    getDirectiveParser(): any;
    addMigrationPath(path: string): void;
    getMigrationDbMeta(): IDbMeta;
    initDb(): Promise<void>;
    getMigrationSqlStatements(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, renameInsteadOfDrop?: boolean): string[];
    getViewsSql(): any[];
    getBootSql(): any[];
    migrate(fromDbMeta: IDbMeta, toDbMeta: IDbMeta, renameInsteadOfDrop?: boolean): Promise<void>;
}
