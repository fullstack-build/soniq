import { IDb } from './IDb';
import { Client as PgClient } from 'pg';
export { PgClient };
export declare class DbAppClient implements IDb {
    pgClient: PgClient;
    private applicationName;
    private credentials;
    private readonly ENVIRONMENT;
    private readonly config;
    private readonly logger;
    private readonly eventEmitter;
    constructor(bootLoader: any, eventEmitter: any, loggerFactory: any, config: any);
    private boot;
    end(): Promise<void>;
    private updateNodeIdsFromDb;
}
