import { IDb } from './IDb';
import { Pool as PgPool } from 'pg';
export { PgPool };
export declare class DbGeneralPool implements IDb {
    private readonly config;
    private readonly applicationName;
    private credentials;
    private managedPool;
    private logger;
    private eventEmitter;
    constructor(eventEmitter?: any, loggerFactory?: any);
    end(): Promise<void>;
    readonly pgPool: PgPool;
    private gracefullyAdjustPoolSize();
    private initConnect();
}
