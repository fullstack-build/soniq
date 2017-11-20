import * as dotenv from 'dotenv-safe';
import * as fastGlob from 'fast-glob';
import * as fs from 'fs';
import * as Koa from 'koa';
import * as _ from 'lodash';
import * as path from 'path';

// fullstackOne imports
import { Db } from '../db/main';
import { Logger } from '../logger/main';
import { IConfig } from './IConfigObject';
import { IEnvironmentInformation } from './IEnvironmentInformation';

// helper
import { graphQlHelper } from '../graphQlHelper/main';
import { getMigrationsUp } from '../graphQlHelper/migration';

export *  from '../graphQlHelper/main';

// init .env -- check if all are set
try {
  dotenv.config();
} catch (err) {
  process.stderr.write(err.toString() + '\n');
  process.exit(1);
}

class FullstackOneCore {
  private ENVIRONMENT: IEnvironmentInformation;
  private CONFIG: IConfig;
  private logger: Logger;
  private dbSetup: Db;
  private dbPool: Db;
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
    this.logger = this.getLogger('core');

    // create Db connection
    this.connectDB();

    // load schemas
    this.loadSchema();

    // set isHTTPS based on KOA with each request

    // start server
    this.startServer();

    // execute book scripts
    this.executeBootScripts();

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
  public getConfig(pModule?: string): any {
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

  // connect to setup db and create a general connection pool
  private connectDB() {
    const configDB = this.getConfig('db');
    // create connection with setup user
    const dbSetup = new Db(this, configDB.setup, false);
    // create general conncetion pool
    const dbPool = new Db(this, configDB.general, true);

  }

  private async loadSchema() {
    try {
      const pattern = this.ENVIRONMENT.path + '/schema/*.gql';
      const graphQlTypes = await graphQlHelper.loadGraphQlSchema(pattern);
      const combinedGraphQlSchema = graphQlTypes.join('\n');

      const graphQlJsonSchema = graphQlHelper.parseGraphQlSchema(combinedGraphQlSchema);

      const tableObjects = graphQlHelper.parseGraphQlJsonSchemaToTableObject(graphQlJsonSchema);
      // this.logger.info('parsed schema: ', JSON.stringify(tableObjects, null, 2));

      const optionalMigrationId = 123;

      // write parsed schema into migrations folder
      await graphQlHelper.writeTableObjectIntoMigrationsFolder(
        `${this.ENVIRONMENT.path}/migrations/`, tableObjects, optionalMigrationId);

      const sqlStatements = await getMigrationsUp(`${this.ENVIRONMENT.path}/migrations/`,
                                                  optionalMigrationId);
      // display result sql in terminal
      this.logger.debug(sqlStatements.join('\n'));

    } catch (err) {
      this.logger.warn('loadGraphQlSchema error', err);
    }
  }

  // execute all boot scripts in the boot folder
  private executeBootScripts() {
    // get all boot files sync
    const files = fastGlob.sync(
      `${this.ENVIRONMENT.path}/boot/*.{ts,js}`,
      { deep: true, onlyFiles: true });

    // sort files
    files.sort();
    // execute all boot scripts
    for (const file of files) {
      // include all boot files sync
      const bootScript = require(file);
      try {
        (bootScript.default != null) ? bootScript.default(this) : bootScript(this);
        this.logger.trace('boot script successful', file);
      } catch (err) {
        this.logger.warn('boot script error', file, err);
      }

    }
  }

  private startServer(): void {
    this.APP = new Koa();
    // start KOA on PORT
    this.APP.listen(this.ENVIRONMENT.port);
    // success log
    this.logger.info('Server listening on port', this.ENVIRONMENT.port);
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

// FullstackOne SINGLETON
const INSTANCE = new FullstackOneCore();
export function getInstance() {
  return INSTANCE;
}
