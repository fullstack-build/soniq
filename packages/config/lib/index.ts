import { Inject, Service, Container } from '@fullstack-one/di';
import * as path from 'path';
import * as _ from 'lodash';
import { randomBytes } from 'crypto';

import { IEnvironment } from './IEnvironment';
import { BootLoader } from '@fullstack-one/boot-loader';
export { IEnvironment };

@Service()
export class Config {

  public readonly ENVIRONMENT: IEnvironment = {
    frameworkVersion: null,
    NODE_ENV: process.env.NODE_ENV,
    name:       null,
    version:    null,
    path:       null,
    port:       null,
    namespace:  null,
    // unique instance ID (6 char)
    nodeId:     null
  };
  private configFolder = [];
  private config: any = {};

  constructor(
    @Inject(type => BootLoader) bootLoader?
  ) {
    // load package config
    this.addConfigFolder(__dirname + '/../config');

    // register boot function to load the projects config file
    bootLoader.addBootFunction(this.boot.bind(this));
  }

  public getConfig(pModuleName?: string): any {

    const config = Container.get('CONFIG');

    if (pModuleName == null) {
      // return copy instead of a ref
      return { ... config };
    } else {
      // return copy instead of a ref
      return { ... config[pModuleName] };
    }
  }

  // load config based on ENV
  public addConfigFolder(configPath: string): void {
    // check if path was already included
    if (!this.configFolder.includes(configPath)) {
      this.configFolder.push(configPath);
    }

    // config files
    const mainConfigPath = `${configPath}/default.js`;
    const envConfigPath = `${configPath}/${this.ENVIRONMENT.NODE_ENV}.js`;

    // require config files
    let config = null;
    // require default config - fail if not found
    try {
      config = require(mainConfigPath);
    } catch (err) {
      process.stderr.write(
        'config.default.loading.error.not.found: ' + mainConfigPath + '\n',
      );
      process.exit();
    }

    // try to load env config – ignore if not found
    try {
      config = _.merge(config, require(envConfigPath));
    } catch (err) {
      // ignore if not found
    }

    // everything seems to be fine so far -> merge with the global settings object
    this.config = _.merge(this.config, config);

    // put config into DI
    Container.set('CONFIG', this.config);
    // update ENVIRONMENT
    this.setEnvironment();
  }

  // set ENVIRONMENT values and wait for packages to fill out placeholder when loaded (core & server)
  private setEnvironment() {
    // load project package.js
    const projectPath = path.dirname(require.main.filename);
    const PROJECT_PACKAGE = require(projectPath + `/package.json`);
    // each package in the mono repo has the same version
    const MODULE_PACKAGE = require(`../package.json`);

    // update ENV
    this.ENVIRONMENT.frameworkVersion = MODULE_PACKAGE.version;
    this.ENVIRONMENT.NODE_ENV         = process.env.NODE_ENV;
    this.ENVIRONMENT.name             = PROJECT_PACKAGE.name;
    this.ENVIRONMENT.version          = PROJECT_PACKAGE.version;
    this.ENVIRONMENT.path             = projectPath;
    // unique instance ID (6 char)
    this.ENVIRONMENT.nodeId           = randomBytes(20).toString('hex').substr(5, 6);
    // wait until core config is set
    if (this.config.core != null) {
      this.ENVIRONMENT.namespace      = this.config.core.namespace;
    }
    // wait until server config is set
    if (this.config.server != null) {
      this.ENVIRONMENT.port           = this.config.server.port;
    }

    // put config into DI
    Container.set('ENVIRONMENT', this.ENVIRONMENT);
  }

  private async boot() {
    // load project config files
    this.addConfigFolder(this.config.config.folder);

    // copy and override config with ENVs (dot = nested object separator)
    Object.keys(process.env).map((envName) => {
      // if name includes a dot it means its a nested object
      if (envName.includes('.')) {
        const envNameAsArray = envName.split('.');
        envNameAsArray.reduce((obj, key, index) => {
          // assign value in last iteration round
          if (index + 1 < envNameAsArray.length) {
            obj[key] = obj[key] || {};
          } else {
            obj[key] = process.env[envName];
          }
          return obj[key];
        }, this.config);

      } else {
        this.config[envName] = process.env[envName];
      }
    });

    // LAST STEP: check config for undefined settings
    let foundMissingConfig = false;
    this.deepMapHelper(this.config, (key, val, nestedPath) => {
      if (val == null) {
        process.stderr.write(
          `config.not.set: ${nestedPath}` + '\n',
        );
        foundMissingConfig = true;
      }
    });
    // missing config found?
    if (!!foundMissingConfig) {
      process.exit();
    }
  }

  /* HELPER */
  private deepMapHelper(obj, callback, nestedPath = '') {
    Object.entries(obj).map((entry) => {
      const newPath = nestedPath + entry[0] + '.';
      (typeof entry[1] === 'object' && entry[1] != null) ?
        this.deepMapHelper(entry[1], callback, newPath) :
        callback(entry[0], entry[1], newPath.slice(0, -1)); // remove last dot on last round
    });
  }

}
