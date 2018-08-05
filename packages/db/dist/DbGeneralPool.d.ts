import { IDb } from './IDb';
import { Pool as PgPool, PoolClient as PgPoolClient } from 'pg';
export { PgPool, PgPoolClient };
export declare class DbGeneralPool implements IDb {
    private readonly config;
    private applicationName;
    private credentials;
    private managedPool;
    private logger;
    private eventEmitter;
    constructor(bootLoader?: any, eventEmitter?: any, loggerFactory?: any, config?: any);
    end(): Promise<void>;
    readonly pgPool: PgPool;
    private boot();
    private gracefullyAdjustPoolSize();
    private initConnect();
}
