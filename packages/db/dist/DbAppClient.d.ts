import { IDb } from "./IDb";
import { Client as PgClient } from "pg";
export { PgClient };
export declare class DbAppClient implements IDb {
  private applicationName;
  private credentials;
  private readonly ENVIRONMENT;
  private readonly config;
  private readonly logger;
  private readonly eventEmitter;
  private readonly CONFIG;
  pgClient: PgClient;
  constructor(bootLoader: any, eventEmitter: any, loggerFactory: any, config: any);
  private boot;
  private updateNodeIdsFromDb;
  end(): Promise<void>;
}
