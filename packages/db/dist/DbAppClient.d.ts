import { IDb } from './IDb';
import { Client as PgClient } from 'pg';
export { PgClient };
export declare class DbAppClient implements IDb {
    readonly pgClient: PgClient;
    private readonly applicationName;
    private credentials;
    private ENVIRONMENT;
    private logger;
    private eventEmitter;
    constructor(eventEmitter?: any, loggerFactory?: any);
    end(): Promise<void>;
    private boot();
    private updateNodeIdsFromDb();
}
