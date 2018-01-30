import * as Koa from 'koa';

// fullstackOne interfaces
import { IFullstackOneCore } from './IFullstackOneCore';
import { IConfig } from './IConfigObject';
import { IEnvironmentInformation } from './IEnvironmentInformation';
import { IDbMeta } from './IDbMeta';
export { IEnvironmentInformation, IDbMeta };

// fullstackOne imports
import { Logger } from './logger';
import { IEventEmitter } from './events';
import { PgClient, PgPool } from '../db';

export interface IFullstackOneCore {
  ENVIRONMENT: IEnvironmentInformation;
  nodeId: string;
  isReady: () => boolean;
  getConfig: (pModuleName?: string) => IConfig | any;
  getLogger: (pModuleName: string) => Logger;
  getApp: () => Koa;
  getEventEmitter: () => IEventEmitter;
  getDbMeta: () => IDbMeta;
  getDbSetupClient: () => PgClient;
  getDbPool: () => PgPool;
  runMigration: () => void;
}
