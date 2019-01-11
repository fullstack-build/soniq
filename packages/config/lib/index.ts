import * as path from "path";
import * as _ from "lodash";

import { Inject, Service, Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";

import { DefaultConfigNotFoundError } from "./errors";
import ConfigIntegrator from "./helpers/ConfigIntegrator";
import EnvironmentBuilder from "./helpers/EnvironmentBuilder";
import { IEnvironment } from "./IEnvironment";

interface IConfigModule {
  name: string;
  path: string;
}

export { default as Errors } from "./errors";
export { IEnvironment };

@Service()
export class Config {
  @Inject((type) => BootLoader)
  private readonly bootLoader: BootLoader;

  private configModules: IConfigModule[] = [];
  private projectConfig: any = {};
  private config: any = {};

  public readonly ENVIRONMENT: IEnvironment;

  constructor() {
    Container.set("CONFIG", {});

    this.ENVIRONMENT = EnvironmentBuilder.buildEnvironment();
    Container.set("ENVIRONMENT", {});

    this.projectConfig = this.loadProjectConfigs();
    this.registerConfig("Config", `${__dirname}/../config`);
  }

  private loadProjectConfigs(): any {
    const projectConfigFolderPath = `${path.dirname(require.main.filename)}/config`;
    this.requireConfigFiles(projectConfigFolderPath);
  }

  private requireConfigFiles(configModulePath: string): any {
    const defaultConfigPath = `${configModulePath}/default.js`;
    const envConfigPath = `${configModulePath}/${this.ENVIRONMENT.NODE_ENV}.js`;

    let defaultConfig: any;
    try {
      defaultConfig = require(defaultConfigPath);
    } catch (err) {
      throw new DefaultConfigNotFoundError(`config.default.loading.error.not.found: ${defaultConfigPath} \n ${err}`);
    }

    let environmentConfig: any;
    try {
      environmentConfig = require(envConfigPath);
    } catch (err) {
      environmentConfig = {};
    }

    return _.defaultsDeep(environmentConfig, defaultConfig);
  }

  private applyConfigModule(moduleName: string, moduleConfigPath: string): any {
    const moduleConfig = { [moduleName]: this.requireConfigFiles(moduleConfigPath) };
    const processEnvironmentConfig = ConfigIntegrator.getProcessEnvironmentConfig();

    this.config = _.defaultsDeep(processEnvironmentConfig, this.projectConfig, this.config, moduleConfig);

    ConfigIntegrator.checkForMissingConfigProperties(this.config);

    return this.config[moduleName];
  }

  public registerConfig(moduleName: string, moduleConfigPath: string): any {
    if (this.configModules.find((configModule) => configModule.name === moduleName) == null) {
      const configModule: IConfigModule = {
        name: moduleName,
        path: moduleConfigPath
      };
      this.configModules.push(configModule);

      return this.applyConfigModule(moduleName, moduleConfigPath);
    } else {
      return this.getConfig(moduleName);
    }
  }

  public getConfig(moduleName?: string): any {
    if (moduleName == null) {
      if (!this.bootLoader.hasBooted() || this.bootLoader.isBooting()) {
        throw Error("Configuration not available before booting.");
      }
      return { ...this.config };
    }

    return { ...this.config[moduleName] };
  }
}
