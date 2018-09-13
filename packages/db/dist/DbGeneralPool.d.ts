import { IDb } from './IDb';
import { Pool as PgPool, PoolClient as PgPoolClient } from 'pg';
export { PgPool, PgPoolClient };
export declare class DbGeneralPool implements IDb {
    private readonly config;
    private applicationName;
    private credentials;
    private managedPool;
    private loggerFactory;
    private logger;
    private eventEmitter;
    constructor(bootLoader: any, eventEmitter: any, loggerFactory: any, config: any);
    private boot();
    end(): Promise<void>;
    readonly pgPool: PgPool;
    private gracefullyAdjustPoolSize();
    private initConnect();
}
