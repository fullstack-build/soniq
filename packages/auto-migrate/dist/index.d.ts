import { Config } from '@fullstack-one/config';
import { Migration } from '@fullstack-one/migration';
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
    private migration;
    constructor(loggerFactory: LoggerFactory, bootLoader: BootLoader, migration: Migration, config: Config, gqlParser: GraphQlParser, dbAppClient: DbAppClient);
    boot(): Promise<void>;
    getDbMeta(): IDbMeta;
    getMigrationSql(): Promise<string[]>;
    runMigration(): Promise<void>;
}
