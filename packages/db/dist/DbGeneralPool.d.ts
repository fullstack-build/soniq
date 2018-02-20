import * as ONE from 'fullstack-one';
import { IDb } from './IDb';
import { Pool as PgPool, Client as PgClient } from 'pg';
export { PgPool };
export declare class DbGeneralPool extends ONE.AbstractPackage implements IDb {
    private readonly config;
    private readonly applicationName;
    private credentials;
    private managedPool;
    private logger;
    private eventEmitter;
    constructor(eventEmitter?: any, loggerFactory?: any);
    end(): Promise<void>;
    readonly pgPool: PgPool;
    connect(): Promise<PgClient>;
    private gracefullyAdjustPoolSize();
    private initConnect();
}
