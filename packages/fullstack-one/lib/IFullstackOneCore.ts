import * as Koa from 'koa';

// fullstackOne interfaces
import { IFullstackOneCore } from './IFullstackOneCore';
import { IConfig } from './IConfigObject';
import { IEnvironment } from './IEnvironment';

export interface IFullstackOneCore {
  ENVIRONMENT: IEnvironment;
  isReady: boolean;
  getConfig: (pModuleName?: string) => IConfig | any;
  app: Koa;
  runMigration: () => void;
}
