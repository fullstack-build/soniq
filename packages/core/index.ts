import * as dotenv from 'dotenv-safe';
import * as onExit from 'signal-exit';
import * as terminus from '@godaddy/terminus';
import * as fastGlob from 'fast-glob';
import * as fs from 'fs';
import * as http from 'http';
import * as Koa from 'koa';
import * as _ from 'lodash';
import * as path from 'path';
import { randomBytes } from 'crypto';

// fullstack-one interfaces
import { AbstractPackage } from './AbstractPackage';
export { AbstractPackage };
import { IFullstackOneCore } from './IFullstackOneCore';
import { IConfig } from './IConfigObject';
import { IEnvironmentInformation } from './IEnvironmentInformation';
import { IDbMeta, IDbRelation } from './IDbMeta';
export { IFullstackOneCore, IEnvironmentInformation, IDbMeta, IDbRelation };

// fullstack-one imports
import { helper } from '../helper';
export { helper } from '../helper';
import { Events, IEventEmitter } from './events';
import { DbClient, DbPool, PgClient, PgPool, PgToDbMeta } from '../db';
import { Logger } from './logger';
import { graphQl } from '../graphQl/index';
import { Migration } from '../migration';
import { Auth } from '../auth';
import { Queue, PgBoss } from '../queue';
import { Email } from '../notifications';

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

class FullstackOneCore implements IFullstackOneCore {

  public readonly ENVIRONMENT: IEnvironmentInformation;
  public readonly nodeId: string;
  private hasBooted: boolean;
  private eventEmitter: IEventEmitter;
  private CONFIG: IConfig;
  private logger: Logger;
  private dbSetupClientObj: DbClient;
  private dbPoolObj: DbPool;
  private server: http.Server;
  private APP: Koa;
  private dbMeta: IDbMeta;
  private knownNodeIds: [string];
  private auth;
  private queue;
  private email;

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
      // getSqlFromMigrationObj unique instance ID (6 char)
      nodeId:  randomBytes(20).toString('hex').substr(5,6),
      namespace: 'f1' // default
    };
    this.nodeId = this.ENVIRONMENT.nodeId;
    // add nodeId to list of known nodes
    this.knownNodeIds = [this.nodeId];

    // load config
    this.loadConfig();

    // set namespace from config
    this.ENVIRONMENT.namespace = this.CONFIG.core.namespace;

    // getSqlFromMigrationObj event emitter
    this.eventEmitter = Events.getEventEmitter(this);

    // init core logger
    this.logger = this.getLogger('core');

    // collect known nodes
    this.eventEmitter.onAnyInstance(`${this.ENVIRONMENT.namespace}.ready`, (nodeId) => {
      this.updateNodeIdsFromDb();
    });

    // has to be exiting before we lose connection
    this.eventEmitter.onAnyInstance(`${this.ENVIRONMENT.namespace}.exiting`, (nodeId) => {
      // wait one tick until it actually finishes
      process.nextTick(() => { this.updateNodeIdsFromDb(); });
    });

    // continue booting async on next tick
    // (is needed in order to be able to call getInstance from outside)
    process.nextTick(() => { this.bootAsync(); });
  }

  /**
   * PUBLIC METHODS
   */
  // return whether server is ready
  public isReady(): boolean {
    return this.hasBooted;
  }

  // return CONFIG
  // return either full config or only module config
  public getConfig(pModuleName?: string): IConfig | any {
    if (pModuleName == null) {
      // return copy instead of a ref
      return { ... this.CONFIG };
    } else {
      // find config key by name case insensitive
      const configKey = Object.keys(this.CONFIG).find(key => key.toLowerCase() === pModuleName.toLowerCase());

      // return copy instead of a ref
      return { ... this.CONFIG[configKey] };
    }
  }

  // return auth instance for Module
  public getAuthInstance() {
    return this.auth;
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
  public getDbMeta(): IDbMeta {
    // return copy instead of ref
    return _.cloneDeep(this.dbMeta);
  }

  // return DB setup connection
  public getDbSetupClient(): PgClient {
    return this.dbSetupClientObj.client;
  }

  // return DB pool
  public getDbPool(): PgPool {
    return this.dbPoolObj.pool;
  }

  // return Queue
  public getQueue(): PgBoss {
    return this.queue;
  }

  public async getMigrationSql() {
    const configDB = this.getConfig('db');
    try {
      const fromDbMeta      = await (new PgToDbMeta()).getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      const migration       = new Migration(fromDbMeta, toDbMeta);
      return migration.getMigrationSqlStatements(configDB.renameInsteadOfDrop);

    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('ERROR', err);
    }
  }

  public async runMigration() {

    const configDB = this.getConfig('db');
    try {
      const fromDbMeta      = await (new PgToDbMeta()).getPgDbMeta();
      const toDbMeta        = this.getDbMeta();
      const migration       = new Migration(fromDbMeta, toDbMeta);
      return await migration.migrate(configDB.renameInsteadOfDrop);

    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('ERROR', err);
    }
  }

  /**
   * PRIVATE METHODS
   */

  private emit(eventName: string, ...args: any[]): void {
    // add namespace
    const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
    this.eventEmitter.emit(eventNamespaceName, this.nodeId, ...args);
  }

  private on(eventName: string, listener: (...args: any[]) => void) {
    // add namespace
    const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
    this.eventEmitter.on(eventNamespaceName, listener);
  }

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

      // connect Db
      await this.connectDB();

      // boot GraphQL and add endpoints
      this.dbMeta = await graphQl.bootGraphQl(this);
      this.emit('dbMeta.set');

      // run auto migration, if enabled
      const configDB = this.getConfig('db');
      if (configDB.automigrate === true) {
        await this.runMigration();
      }

      // start server
      await this.startServer();

      // Load Auth
      this.auth = new Auth();

      // add GraphQL endpoints
      await graphQl.addEndpoints(this);

      // init queue
      const queue = new Queue();
      this.queue = await queue.start();

      // notifications
      this.email = new Email();

      // console.error('***>>', await this.email.sendMessage('test@test.de', 'test subject', 'html content'));

      // execute book scripts
      await this.executeBootScripts();

      // draw cli
      this.cliArt();

      // emit ready event
      this.hasBooted = true;
      this.emit('ready', this.nodeId);
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('An error occurred while booting', err);
      this.logger.error('An error occurred while booting', err);
      this.emit('not-ready', err);
    }

  }

  // connect to setup db and getSqlFromMigrationObj a general connection pool
  private async connectDB() {
    const configDB = this.getConfig('db');

    try {
      // getSqlFromMigrationObj connection with setup user
      const configDbWithAppName = configDB.setup;
      configDbWithAppName.application_name = this.ENVIRONMENT.namespace + '_client_' + this.nodeId;
      this.dbSetupClientObj = new DbClient(configDbWithAppName);
      // getSqlFromMigrationObj connection
      await this.dbSetupClientObj.create();
      // emit event
      this.emit('db.setup.connection.created');

      // getSqlFromMigrationObj pool
      await _gracefullyAdjustPoolSize.bind(this)();

      // and adjust pool size for every node change
      this.on(`nodes.changed`, (nodeId) => { _gracefullyAdjustPoolSize.bind(this)(); });

      async function _gracefullyAdjustPoolSize() {

        // gracefully end pool if already available
        if (this.dbPoolObj != null) {
          // dont wait for promise, we just immediately getSqlFromMigrationObj a new pool
          this.dbPoolObj.end();
        }

        const knownNodes: number = this.knownNodeIds.length;
        // reserve one for setup connection
        const connectionsPerInstance: number = Math.floor((configDB.general.totalMax / knownNodes - 1));

        // getSqlFromMigrationObj general connection pool
        const generalDbWithAppNameAndMaxConnections = {
          ... configDB.general,
          application_name: this.ENVIRONMENT.namespace + '_pool_' + this.nodeId,
          max: connectionsPerInstance
        };
        // new pool with adjusted number of connections
        this.dbPoolObj = new DbPool(generalDbWithAppNameAndMaxConnections);
        // getSqlFromMigrationObj pool
        await this.dbPoolObj.create();
        // emit event
        this.emit('db.pool.created');
      }

    } catch (err) {
      throw err;
    }

  }

  private async disconnectDB() {

    try {
      // end setup client and pool
      await Promise.all([
          this.dbSetupClientObj.end(),
          this.dbPoolObj.end()
        ]);

      // emit event
      this.emit('db.setup.connection.ended');
      // emit event
      this.emit('db.pool.ended');
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
    this.emit('server.up', this.ENVIRONMENT.port);
    // success log
    this.logger.info('Server listening on port', this.ENVIRONMENT.port);
  }

  private gracefulShutdown() {
    terminus(this.server, {
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

    // release resources here before node exits
    onExit(async (exitCode, signal) => {

      if (signal) {
        this.logger.info('exiting');

        this.logger.info('starting cleanup');
        this.emit('exiting', this.ENVIRONMENT.nodeId);
        try {

          // close DB connections - has to by synchronous - no await
          // try to exit as many as possible
          this.disconnectDB();

          this.logger.info('shutting down');

          this.emit('down', this.ENVIRONMENT.nodeId);
          return true;
        } catch (err) {

          this.logger.warn('Error occurred during clean up attempt', err);
          this.emit('server.sigterm.error', this.ENVIRONMENT.nodeId, err);
          throw err;
        }
      }
      return false;
    });

  }

  private async updateNodeIdsFromDb(): Promise<void> {

    try {
      const dbName = this.getConfig('db').general.database;
      const applicationNamePrefix = `${this.ENVIRONMENT.namespace}_client_`;
      const dbNodes = await this.dbSetupClientObj.client.query(
        `SELECT * FROM pg_stat_activity WHERE datname = '${dbName}' AND application_name LIKE '${applicationNamePrefix}%';`
      );
      const nodeIds: [string] = dbNodes.rows.map((row) => {
        return row.application_name.replace(applicationNamePrefix, '');
      }) as [string];
      // check if number of nodes has changed
      if (this.knownNodeIds.length !== nodeIds.length) {
        this.knownNodeIds = nodeIds;
        this.emit('nodes.changed');
      }

    } catch (err) {
      this.logger.warn(err);
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

// One SINGLETON
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
      $one.getEventEmitter().on(`${$one.ENVIRONMENT.namespace}.ready`, () => {
        $resolve($one);
      });
      // catch not ready event
      $one.getEventEmitter().on(`${$one.ENVIRONMENT.namespace}.not-ready`, (err) => {
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
