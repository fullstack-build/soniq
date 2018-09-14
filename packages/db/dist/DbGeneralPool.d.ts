import { IDb } from './IDb';
import { Pool as PgPool, PoolClient as PgPoolClient } from 'pg';
export { PgPool, PgPoolClient };
export declare class DbGeneralPool implements IDb {
    private applicationName;
    private credentials;
    private managedPool;
    private readonly config;
    private readonly logger;
    private readonly eventEmitter;
    constructor(bootLoader: any, eventEmitter: any, loggerFactory: any, config: any);
    private boot;
    end(): Promise<void>;
    readonly pgPool: PgPool;
    private gracefullyAdjustPoolSize;
    private initConnect;
}
