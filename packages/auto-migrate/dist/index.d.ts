import { Config } from '@fullstack-one/config';
import { LoggerFactory } from '@fullstack-one/logger';
import { BootLoader } from '@fullstack-one/boot-loader';
import { IDbMeta, DbAppClient } from '@fullstack-one/db';
import { GraphQlParser } from '@fullstack-one/graphql-parser';
export declare class AutoMigrate {
    private ENVIRONMENT;
    private logger;
    private eventEmitter;
    private gqlParser;
    private config;
    constructor(loggerFactory: LoggerFactory, bootLoader: BootLoader, config: Config, gqlParser: GraphQlParser, dbAppClient: DbAppClient);
    boot(): Promise<void>;
    getDbMeta(): IDbMeta;
    getMigrationSql(): Promise<string[]>;
    runMigration(): Promise<void>;
}
