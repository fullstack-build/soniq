import 'reflect-metadata';
export * from 'typedi';
import * as Koa from 'koa';
import { IFullstackOneCore } from './IFullstackOneCore';
import { IConfig } from './IConfigObject';
import { IEnvironment } from './IEnvironment';
import { IDbMeta, IDbRelation } from './IDbMeta';
import { AbstractPackage } from './AbstractPackage';
import { helper } from '@fullstack-one/helper';
import { LoggerFactory, ILogger } from '@fullstack-one/logger';
import { EventEmitter } from '@fullstack-one/events';
import { DbAppClient, DbGeneralPool } from '@fullstack-one/db';
export { IFullstackOneCore, IConfig, IEnvironment, IDbMeta, IDbRelation, ILogger };
export { AbstractPackage, helper, LoggerFactory, EventEmitter, DbAppClient, DbGeneralPool };
export declare class FullstackOneCore extends AbstractPackage implements IFullstackOneCore {
    readonly ENVIRONMENT: IEnvironment;
    private hasBooted;
    private logger;
    private eventEmitter;
    private dbAppClient;
    private dbPoolObj;
    private server;
    private APP;
    private dbMeta;
    constructor(loggerFactory?: any);
    /**
     * PUBLIC METHODS
     */
    readonly isReady: boolean;
    readonly app: Koa;
    getDbMeta(): IDbMeta;
    getMigrationSql(): Promise<string[]>;
    runMigration(): Promise<void>;
    /**
     * PRIVATE METHODS
     */
    private bootAsync();
    private emit(eventName, ...args);
    private on(eventName, listener);
    private loadConfig();
    private connectDB();
    private disconnectDB();
    private executeBootScripts();
    private startServer();
    private gracefulShutdown();
    private cliArt();
}
export declare function getInstance(): FullstackOneCore;
export declare function getReadyPromise(): Promise<FullstackOneCore>;
export declare function eventToPromise(pEventName: string): Promise<any>;
