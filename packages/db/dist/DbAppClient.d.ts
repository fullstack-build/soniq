import { IDb } from './IDb';
import { Client as PgClient } from 'pg';
export { PgClient };
export declare class DbAppClient implements IDb {
    pgClient: PgClient;
    private applicationName;
    private credentials;
    private ENVIRONMENT;
    private logger;
    private eventEmitter;
    private config;
    constructor(bootLoader?: any, eventEmitter?: any, loggerFactory?: any, config?: any);
    end(): Promise<void>;
    private boot();
    private updateNodeIdsFromDb();
}
