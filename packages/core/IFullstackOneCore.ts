import * as Koa from 'koa';

// fullstackOne interfaces
import { IFullstackOneCore } from './IFullstackOneCore';
import { IConfig } from './IConfigObject';
import { IEnvironmentInformation } from './IEnvironment';
import { IDbMeta } from './IDbMeta';
export { IEnvironmentInformation, IDbMeta };

// fullstackOne imports
import { Logger } from '../logger/Logger';
import { EventEmitter } from '../events';
import { PgClient, PgPool } from '../db';
import { PgBoss } from '../queue';

export interface IFullstackOneCore {
  ENVIRONMENT: IEnvironmentInformation;
  NODE_ID: string;
  isReady: boolean;
  getConfig: (pModuleName?: string) => IConfig | any;
  getLogger: (pModuleName: string) => Logger;
  getApp: () => Koa;
  getEventEmitter: () => EventEmitter;
  getDbMeta: () => IDbMeta;
  getDbSetupClient: () => PgClient;
  getDbPool: () => PgPool;
  runMigration: () => void;
  getQueue: () => PgBoss;
}
