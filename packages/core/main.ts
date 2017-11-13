import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Koa from 'koa';
import * as _ from 'lodash';
import * as path from 'path';

// fullstackOne imports
import { Logger } from '../logger/main';
import { IConfig } from './IConfigObject';
import { IEnvironmentInformation } from './IEnvironmentInformation';

// init .env
dotenv.config();

export namespace FullstackOne {
  class Core {
    private ENVIRONMENT: IEnvironmentInformation;
    private CONFIG: IConfig;
    private logger: Logger;
    private APP: Koa;

    constructor() {
      // load project package.js
      const projectPath = path.dirname(require.main.filename);
      const PROJECT_PACKAGE = require(`${projectPath}/package.json`);

      // ENV CONST
      this.ENVIRONMENT = {
        env: process.env.NODE_ENV,
        name: PROJECT_PACKAGE.name,
        path: projectPath,
        port: parseInt(process.env.PORT, 10),
        version: PROJECT_PACKAGE.version,
      };
      // load config
      this.loadConfig();

      // init core logger
      this.logger = this.getLogger('main');

      // set isHTTPS based on KOA with each request

      // start server
      this.startServer();

      // draw cli
      this.cliArt();
    }

    /**
     * PUBLIC METHODS
     */

    // return EnvironmentInformation
    public getEnvironmentInformation(): IEnvironmentInformation {
      return this.ENVIRONMENT;
    }

    // return CONFIG
    // return either full config or only module config
    public getConfig(pModule?: string): IConfig {
      if (pModule == null) {
        return this.CONFIG;
      } else {
        return this.CONFIG[pModule];
      }
    }

    // return Logger instance for Module
    public getLogger(pModuleName: string): Logger {
      return new Logger(this, pModuleName);
    }

    // return APP
    public getApp(): Koa {
      return this.APP;
    }

    /**
     * PRIVATE METHODS
     */

    // load config based on ENV
    private loadConfig(): void {
      const mainConfigPath  = `${this.ENVIRONMENT.path}/config/default.ts`;
      const envConfigPath   = `${this.ENVIRONMENT.path}/config/${this.ENVIRONMENT.env}.ts`;

      // load default config
      let config: IConfig;
      if (!!fs.existsSync(mainConfigPath)) {
        config = require(mainConfigPath);
      }
      // extend with env config
      if (!!fs.existsSync(envConfigPath)) {
        _.merge(config, require(envConfigPath));
      }
      this.CONFIG = config;
    }

    private startServer(): void {
      this.APP = new Koa();
      // start KOA on PORT
      this.APP.listen(this.ENVIRONMENT.port);
      // success log
      this.logger.info('Server Listening on port', this.ENVIRONMENT.port);
    }

    // draw CLI art
    private cliArt(): void {

      process.stdout.write('┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n' +
        '├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤ \n' +
        '└  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n');
      process.stdout.write('name: ' + this.ENVIRONMENT.name + '\n');
      process.stdout.write('version: ' + this.ENVIRONMENT.version + '\n');
      process.stdout.write('path: ' + this.ENVIRONMENT.path + '\n');
      process.stdout.write('env: ' + this.ENVIRONMENT.env + '\n');
      process.stdout.write('port: ' + this.ENVIRONMENT.port + '\n');
      process.stdout.write('____________________________________\n');

    }

  }

  // fullstack-one SINGLETON
  const INSTANCE = new Core();
  export function getInstance() {
    return INSTANCE;
  }
}
