import * as dotenv from 'dotenv-safe';
import * as fastGlob from 'fast-glob';
import * as fs from 'fs';
import * as Koa from 'koa';
import * as _ from 'lodash';
import * as path from 'path';
import { EventEmitter2 } from 'eventemitter2';

// fullstackOne imports
import { Db } from '../db';
import { Logger } from '../logger';
import { graphQl } from '../graphQl/index';

// fullstackOne interfaces
import { IConfig } from './IConfigObject';
import { IEnvironmentInformation } from './IEnvironmentInformation';
import { IDatabaseObject } from './IDatabaseObject';

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
  private CONFIG: IConfig;
  private logger: Logger;
  private eventEmitter: EventEmitter2;
  private dbSetup: Db;
  private dbPool: Db;
  private APP: Koa;
  private dbObject: IDatabaseObject;

  constructor() {
    this.hasBooted = false;

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

    // create event emitter
    this.eventEmitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 100,
      verboseMemoryLeak: true,
    });

    // load config
    this.loadConfig();

    // init core logger
    this.logger = this.getLogger('core');

    // continue booting async
    this.bootAsync();
  }

  /**
   * PUBLIC METHODS
   */

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

  // return eventEmitter
  public getApp(): Koa {
    return this.APP;
  }

  // return APP
  public getEventEmitter(): EventEmitter2 {
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

  /**
   * PRIVATE METHODS
   */

  public emit = (eventName: string, ...args: any[]): void => {
    this.eventEmitter.emit(`fullstack-one.${eventName}`, ...args);
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
    this.emit('config.loaded', config);
  }

  // boot async and fire event when ready
  private async bootAsync(): Promise<void> {

    // create Db connection
    await this.connectDB();

    // start server
    await this.startServer();

    // boot GraphQL and add endpoints
    this.dbObject = await graphQl.bootGraphQl(this);
    this.emit('dbObject.set');

    // execute book scripts
     await this.executeBootScripts();

    // draw cli
    this.cliArt();

    // emit ready event
    this.hasBooted = true;
    this.emit('ready', this);

  }

  // connect to setup db and create a general connection pool
  private connectDB() {
    const configDB = this.getConfig('db');

    // create connection with setup user
    const dbSetup = new Db(this, configDB.setup, false);
    // emit event
    this.emit('db.setup.connection.created');

    // create general conncetion pool
    const dbPool = new Db(this, configDB.general, true);
    // emit event
    this.emit('db.pool.created');
  }

/*
  private async loadSchema() {
    try {
      const pattern = this.ENVIRONMENT.path + '/schema/*.gql';
      const graphQlTypes = await graphQlHelper.loadFilesByGlobPattern(pattern);
      this.gQlSchema = graphQlTypes.join('\n');
      // emit event
      this.emit('schema.load.success');

      this.gQlJsonSchema = graphQlHelper.parseGraphQlSchema(this.gQlSchema);
      // emit event
      this.emit('schema.parsed');

      const tableObjects = graphQlHelper.parseGraphQlJsonSchemaToDbObject(this.gQlJsonSchema);
      // emit event
      this.emit('schema.dbObject.parsed');

      const optionalMigrationId = 123;

      // write parsed schema into migrations folder
      await graphQlHelper.writeTableObjectIntoMigrationsFolder(
        `${this.ENVIRONMENT.path}/migrations/`,
        tableObjects,
        optionalMigrationId,
      );
      // emit event
      this.emit('schema.dbObject.migration.saved');

      const sqlStatements = await getMigrationsUp(
        `${this.ENVIRONMENT.path}/migrations/`,
        optionalMigrationId,
      );
      // emit event
      this.emit('schema.dbObject.migration.up.executed');

      // display result sql in terminal
      this.logger.debug(sqlStatements.join('\n'));
    } catch (err) {
      this.logger.warn('loadFilesByGlobPattern error', err);
      // emit event
      this.emit('schema.load.error');
    }
  }
*/

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
    this.APP.listen(this.ENVIRONMENT.port);
    // emit event
    this.emit('server.up', this.ENVIRONMENT.port);
    // success log
    this.logger.info('Server listening on port', this.ENVIRONMENT.port);
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
    process.stdout.write('____________________________________\n');
  }

}

// GETTER

// FullstackOne SINGLETON
const INSTANCE = new FullstackOneCore();
export function getInstance(): FullstackOneCore {
  return INSTANCE;
}

// return finished booting promise
export function getBootingPromise(): Promise<FullstackOneCore> {
  return new Promise(($resolve, $reject) => {

    // already booted?
    if (this.hasBooted) {
      $resolve(INSTANCE);
    } else {

      INSTANCE.getEventEmitter().on('fullstack-one.ready', () => {
        $resolve(INSTANCE);
      });
    }

  });
}

// helper to confert an event to a promise
export function eventToPromise(pEventName: string): Promise<any> {
  return new Promise(($resolve, $reject) => {
    INSTANCE.getEventEmitter().on(pEventName, (...args: any[]) => {
      $resolve([... args]);
    });

  });
}
