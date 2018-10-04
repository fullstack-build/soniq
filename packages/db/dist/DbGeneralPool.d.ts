import { IDb } from "./IDb";
import { Pool as PgPool, PoolClient as PgPoolClient } from "pg";
export { PgPool, PgPoolClient };
export declare class DbGeneralPool implements IDb {
    readonly pgPool: PgPool;
    private applicationName;
    private credentials;
    private managedPool;
    private readonly config;
    private readonly logger;
    private readonly eventEmitter;
    private readonly CONFIG;
    constructor(bootLoader: any, eventEmitter: any, loggerFactory: any, config: any);
    private boot;
    private gracefullyAdjustPoolSize;
    private initConnect;
    end(): Promise<void>;
}
