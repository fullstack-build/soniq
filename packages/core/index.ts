import * as dotenv from 'dotenv-safe';
import * as terminus from '@godaddy/terminus';
import * as fastGlob from 'fast-glob';
import * as fs from 'fs';
import * as http from 'http';
import * as Koa from 'koa';
import * as _ from 'lodash';
import * as path from 'path';
import { randomBytes } from 'crypto';

// fullstackOne imports
import { helper } from '../helper';
export { helper } from '../helper';
import { Events, IEventEmitter } from '../events';
import { Db, Client, Pool } from '../db';
import { Logger } from '../logger';
import { graphQl } from '../graphQl/index';
import { migration } from '../migration/index';

// fullstackOne interfaces
import { IConfig } from './IConfigObject';
import { IEnvironmentInformation } from './IEnvironmentInformation';
import { IDatabaseObject } from './IDatabaseObject';
export { IEnvironmentInformation, IDatabaseObject };

// helper
// import { graphQlHelper } from '../graphQlHelper/main';
// import { getMigrationsUp } from '../graphQlHelper/migration';

// init .env -- check if all are set
try {
  dotenv.config({
    // .env.example is in fullstack-one root folder
    sample: `${__dirname}/../../.env.example`,
  });
} catch (err) {
  process.stderr.write(err.toString() + '\n');
  process.exit(1);
}

class FullstackOneCore {
  private hasBooted: boolean;
  private ENVIRONMENT: IEnvironmentInformation;
  private eventEmitter: IEventEmitter;
  private CONFIG: IConfig;
  private logger: Logger;
  private dbSetupObj: Db;
  private dbPoolObj: Db;
  private server: http.Server;
  private APP: Koa;
  private dbObject: IDatabaseObject;

  constructor() {

    this.hasBooted = false;

    // load project package.js
    const projectPath = path.dirname(require.main.filename);
    const PROJECT_PACKAGE = require(`${projectPath}/package.json`);

    // ENV CONST
    this.ENVIRONMENT = {
      env:     process.env.NODE_ENV,
      name:    PROJECT_PACKAGE.name,
      path:    projectPath,
      port:    parseInt(process.env.PORT, 10),
      version: PROJECT_PACKAGE.version,
      // create unique instance ID (6 char)
      nodeId:  randomBytes(20).toString('hex').substr(5,6)
    };

    // load config
    this.loadConfig();

    // create event emitter
    this.eventEmitter = Events.getEventEmitter(this);

    // init core logger
    this.logger = this.getLogger('core');

    // continue booting async
    this.bootAsync();
  }

  /**
   * PUBLIC METHODS
   */
  // return whether server is ready
  public isReady() {
    return this.hasBooted;
  }

  // return nodeId
  public getNodeId(): string {
    return this.ENVIRONMENT.nodeId;
  }

  // return EnvironmentInformation
  public getEnvironmentInformation(): IEnvironmentInformation {
    // return copy instead of a ref
    return { ...this.ENVIRONMENT };
  }

  // return CONFIG
  // return either full config or only module config
  public getConfig(pModule?: string): any {
    if (pModule == null) {
      // return copy instead of a ref
      return { ... this.CONFIG };
    } else {
      // return copy instead of a ref
      return { ... this.CONFIG[pModule] };
    }
  }

  // return Logger instance for Module
  public getLogger(pModuleName: string): Logger {
    return new Logger(this, pModuleName);
  }

  // return koa app
  public getApp(): Koa {
    return this.APP;
  }

  // return EventEmitter
  public getEventEmitter(): IEventEmitter  {
    return this.eventEmitter;
  }

  // forward GraphQl Schema
  public async getGraphQlSchema() {
    return await graphQl.getGraphQlSchema();
  }

  // forward GraphQl JSON Schema
  public async getGraphQlJsonSchema() {
    return await graphQl.getGraphQlJsonSchema();
  }

  // return DB object
  public getDbObject() {
    // return copy instead of ref
    return { ...this.dbObject };
  }

  // return DB setup connection
  public async getDbSetupClient(): Promise<Client> {
    return await this.dbSetupObj.getClient();
  }

  // return DB pool
  public async getDbPool(): Promise<Pool> {
    return await this.dbPoolObj.getPool();
  }

  public runMigration() {
    migration.createMigration();
  }

  /**
   * PRIVATE METHODS
   */

  // load config based on ENV
  private loadConfig(): void {
    // framework config path
    const frameworkConfigPath = `../../config/default.ts`;

    // project config paths
    const mainConfigPath = `${this.ENVIRONMENT.path}/config/default.ts`;
    const envConfigPath = `${this.ENVIRONMENT.path}/config/${this.ENVIRONMENT.env}.ts`;

    // load framework config file
    let config: IConfig = require(frameworkConfigPath);

    // extend framework config
    // with project config (so it can override framework settings
    if (!!fs.existsSync(mainConfigPath)) {
      config = _.merge(config, require(mainConfigPath));
    }
    // extend with env config
    if (!!fs.existsSync(envConfigPath)) {
      config = _.merge(config, require(envConfigPath));
    }
    this.CONFIG = config;
  }

  // boot async and fire event when ready
  private async bootAsync(): Promise<void> {

    try {

      // create Db connection
      await this.connectDB();

      // start server
      await this.startServer();

      // boot GraphQL and add endpoints
      this.dbObject = await graphQl.bootGraphQl(this);
      this.eventEmitter.emit('dbObject.set');

      // execute book scripts
      await this.executeBootScripts();

      // draw cli
      this.cliArt();

      // emit ready event
      this.hasBooted = true;
      this.eventEmitter.emit('ready', this.getNodeId());
    } catch (err) {
      this.logger.error('An error occurred while booting', err);
      this.eventEmitter.emit('not-ready', err);
    }

  }

  // connect to setup db and create a general connection pool
  private async connectDB() {
    const configDB = this.getConfig('db');

    try {
      // create connection with setup user
      this.dbSetupObj = new Db(this, configDB.setup);
      // emit event
      this.eventEmitter.emit('db.setup.connection.created');

      // create general connection pool
      this.dbPoolObj = new Db(this, configDB.general);
      // emit event
      this.eventEmitter.emit('db.pool.created');
    } catch (err) {
      throw err;
    }

  }

  private async disconnectDB() {

    try {
      // end setup client
      await this.dbSetupObj.endClient();
      // emit event
      this.eventEmitter.emit('db.setup.connection.ended');

      // end pool
      await this.dbPoolObj.endPool();
      // emit event
      this.eventEmitter.emit('db.pool.ended');
      return true;

    } catch (err) {
      throw err;
    }

  }

  // execute all boot scripts in the boot folder
  private async executeBootScripts() {
    // get all boot files sync
    const files = fastGlob.sync(`${this.ENVIRONMENT.path}/boot/*.{ts,js}`, {
      deep: true,
      onlyFiles: true,
    });

    // sort files
    files.sort();
    // execute all boot scripts
    for (const file of files) {
      // include all boot files sync
      const bootScript = require(file);
      try {
        bootScript.default != null
          ? await bootScript.default(this)
          : await bootScript(this);
        this.logger.trace('boot script successful', file);
      } catch (err) {
        this.logger.warn('boot script error', file, err);
      }
    }
  }

  private async startServer(): Promise<void> {
    this.APP = new Koa();

    // start KOA on PORT
    this.server = http.createServer(this.APP.callback()).listen(this.ENVIRONMENT.port);

    // register graceful shutdown - terminus
    this.gracefulShutdown();

    // emit event
    this.eventEmitter.emit('server.up', this.ENVIRONMENT.port);
    // success log
    this.logger.info('Server listening on port', this.ENVIRONMENT.port);
  }

  private gracefulShutdown() {
    terminus(this.server, {
      onSigterm,
      // healtcheck options
      healthChecks: {
        // for now we only resolve a promise to make sure the server runs
        '/_health/liveness': () => Promise.resolve(),
        // make sure we are ready to answer requests
        '/_health/readiness': () => getReadyPromise()
      },
      // cleanup options
      timeout: 1000,
      logger: this.logger.info
    });

    async function onSigterm() {
      this.logger.info('server is starting cleanup');
      this.eventEmitter.emit('server.sigterm', this.getNodeId());

      try {

        // close DB connections
        await this.disconnectDB();
        this.logger.info('server is shutting down');
        this.eventEmitter.emit('server.shutdown', this.getNodeId());
        return true;
      } catch (err) {

        this.logger.warn('Error occurred during clean up attempt', err);
        this.eventEmitter.emit('server.sigterm.error', this.getNodeId(), err);
        throw err;
      }
    }
  }

  // draw CLI art
  private cliArt(): void {
    process.stdout.write(
      '┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n' +
        '├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤ \n' +
        '└  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n',
    );
    process.stdout.write('name: ' + this.ENVIRONMENT.name + '\n');
    process.stdout.write('version: ' + this.ENVIRONMENT.version + '\n');
    process.stdout.write('path: ' + this.ENVIRONMENT.path + '\n');
    process.stdout.write('env: ' + this.ENVIRONMENT.env + '\n');
    process.stdout.write('port: ' + this.ENVIRONMENT.port + '\n');
    process.stdout.write('node id: ' + this.ENVIRONMENT.nodeId + '\n');
    process.stdout.write('____________________________________\n');
  }

}

// GETTER

// FullstackOne SINGLETON
const $one = new FullstackOneCore();
export function getInstance(): FullstackOneCore {
  return $one;
}

// return finished booting promise
export function getReadyPromise(): Promise<FullstackOneCore> {
  return new Promise(($resolve, $reject) => {

    // already booted?
    if ($one.isReady()) {
      $resolve($one);
    } else {

      // catch ready event
      $one.getEventEmitter().on(`${$one.getConfig('eventEmitter').namespace}.ready`, () => {
        $resolve($one);
      });
      // catch not ready event
      $one.getEventEmitter().on(`${$one.getConfig('eventEmitter').namespace}.not-ready`, (err) => {
        $reject(err);
      });
    }

  });
}

// helper to confert an event to a promise
export function eventToPromise(pEventName: string): Promise<any> {
  return new Promise(($resolve, $reject) => {
    $one.getEventEmitter().on(pEventName, (...args: any[]) => {
      $resolve([... args]);
    });

  });
}
