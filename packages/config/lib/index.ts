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
  configDirectory: string;
}

export { default as Errors } from "./errors";
export { IEnvironment };

@Service()
export class Config {
  @Inject((type) => BootLoader)
  private readonly bootLoader: BootLoader;

  private configModules: IConfigModule[] = [];
  private applicationConfig: any = {};
  private config: any = {};

  private readonly NODE_ENV = process.env.NODE_ENV;
  public readonly ENVIRONMENT: IEnvironment;

  constructor() {
    Container.set("CONFIG", {});

    this.applicationConfig = this.loadApplicationConfig();
    this.registerConfig("Config", `${__dirname}/../config`);

    const namespace = this.config.Config.namespace;
    this.ENVIRONMENT = EnvironmentBuilder.buildEnvironment(this.NODE_ENV, namespace);
    Container.set("ENVIRONMENT", {});
  }

  private loadApplicationConfig(): any {
    const applicationConfigFolderPath = `${path.dirname(require.main.filename)}/config`;
    return this.requireConfigFiles(applicationConfigFolderPath);
  }

  private requireConfigFiles(configDirectory: string): any {
    const defaultConfigPath = `${configDirectory}/default.js`;
    const envConfigPath = `${configDirectory}/${this.NODE_ENV}.js`;

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

  private applyConfigModule(name: string, configDirectory: string): any {
    const moduleConfig = { [name]: this.requireConfigFiles(configDirectory) };
    const processEnvironmentConfig = ConfigIntegrator.getProcessEnvironmentConfig();

    this.config = _.defaultsDeep(processEnvironmentConfig, this.applicationConfig, this.config, moduleConfig);

    ConfigIntegrator.checkForMissingConfigProperties(this.config);

    return this.config[name];
  }

  public registerConfig(name: string, configDirectory: string): any {
    if (this.configModules.find((configModule) => configModule.name === name) == null) {
      const configModule: IConfigModule = {
        name,
        configDirectory
      };
      this.configModules.push(configModule);

      return this.applyConfigModule(name, configDirectory);
    } else {
      return this.getConfig(name);
    }
  }

  public getConfig(name?: string): any {
    if (name == null) {
      if (!this.bootLoader.hasBooted() || this.bootLoader.isBooting()) {
        throw new Error("Configuration not available before booting.");
      }
      return { ...this.config };
    } else if (!_.has(this.config, name)) {
      throw new Error();
    }
    return { ...this.config[name] };
  }
}
