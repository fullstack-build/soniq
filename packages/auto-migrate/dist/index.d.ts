import { Config } from '@fullstack-one/config';
import { SchemaBuilder, IDbMeta } from '@fullstack-one/schema-builder';
import { LoggerFactory } from '@fullstack-one/logger';
import { BootLoader } from '@fullstack-one/boot-loader';
import { DbAppClient } from '@fullstack-one/db';
export declare class AutoMigrate {
    private ENVIRONMENT;
    private loggerFactory;
    private logger;
    private eventEmitter;
    private schemaBuilder;
    private config;
    constructor(loggerFactory: LoggerFactory, bootLoader: BootLoader, config: Config, schemaBuilder: SchemaBuilder, dbAppClient: DbAppClient);
    boot(): Promise<void>;
    getDbMeta(): IDbMeta;
    getMigrationSql(): Promise<string[]>;
    runMigration(): Promise<void>;
}
