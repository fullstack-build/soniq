import { IConfig } from './IConfigObject';
import { Service, Container } from '@fullstack-one/di';
import * as path from 'path';
import * as fs from 'fs';
import { IEnvironment } from './IEnvironment';
import { randomBytes } from 'crypto';

export { IEnvironment, IConfig };
import * as _ from 'lodash';

@Service()
export class Config {

  public readonly ENVIRONMENT: IEnvironment;

  constructor() {

    // load project package.js
    const projectPath = path.dirname(require.main.filename);
    const PROJECT_PACKAGE = require(`${projectPath}/package.json`);

    // ENV CONST
    this.ENVIRONMENT = {
      NODE_ENV: process.env.NODE_ENV,
      name:     PROJECT_PACKAGE.name,
      path:     projectPath,
      port:     parseInt(process.env.PORT, 10),
      version:  PROJECT_PACKAGE.version,
      // getSqlFromMigrationObj unique instance ID (6 char)
      nodeId:   randomBytes(20).toString('hex').substr(5,6),
      namespace:  'one' // default
    };

    // load config
    this.loadConfig();

    // set namespace from config
    this.ENVIRONMENT.namespace = this.getConfig('core').namespace;
    // put ENVIRONMENT into DI
    Container.set('ENVIRONMENT', this.ENVIRONMENT);
  }

  public getConfig(pModuleName?: string): IConfig | any {

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
  private loadConfig(): void {
    // framework config path
    const frameworkConfigPath = `./default`;

    // project config paths
    const mainConfigPath = `${this.ENVIRONMENT.path}/config/default.ts`;
    const envConfigPath = `${this.ENVIRONMENT.path}/config/${this.ENVIRONMENT.NODE_ENV}.ts`;

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

    // put config into DI
    Container.set('CONFIG', config);
  }

}
