import * as path from "path";
import * as _ from "lodash";

import ConfigMergeHelper from "./helpers/ConfigMergeHelper";
import EnvironmentBuilder from "./helpers/EnvironmentBuilder";
import { IEnvironment } from "./IEnvironment";
export { IEnvironment };

export class ConfigManager {
  private _applicationConfig: object = {};
  private _config: { Config: { namespace: string } } = {
    Config: { namespace: "soniq" },
  };

  private readonly _NODE_ENV: string = process.env?.NODE_ENV ?? "production";
  public readonly ENVIRONMENT: IEnvironment;

  public constructor() {
    this._applicationConfig = this._loadApplicationConfig();
    this.registerConfig(this.constructor.name, `${__dirname}/../config`);

    const namespace: string = this._config.Config.namespace;
    this.ENVIRONMENT = EnvironmentBuilder.buildEnvironment(
      this._NODE_ENV,
      namespace
    );
  }

  private _loadApplicationConfig(): object {
    const applicationConfigFolderPath: string = `${path.dirname(
      require.main?.filename ?? ""
    )}/config`;
    return this._getConfigFromConfigFiles(applicationConfigFolderPath);
  }

  private _getConfigFromConfigFiles(configDirectory: string): object {
    const defaultConfigPath: string = `${configDirectory}/default.js`;
    const environmentConfigPath: string = `${configDirectory}/${this._NODE_ENV}.js`;

    let defaultConfig: object;
    try {
      defaultConfig = require(defaultConfigPath);
    } catch (err) {
      defaultConfig = {};

      console.warn(
        `config.default.loading.error.not.found: Continuing without app configuration. Was expecting file at ${defaultConfigPath}`
      );
    }

    let environmentConfig: object;
    try {
      environmentConfig = require(environmentConfigPath);
    } catch (err) {
      environmentConfig = {};
    }

    return _.defaultsDeep(environmentConfig, defaultConfig);
  }

  private _applyConfigModule(name: string, baseConfigModule: object): void {
    if (name in this._config) return;

    const applicationConfigOfModule: object =
      this._applicationConfig[name] || {};
    const processEnvironmentConfigOfModule: object = ConfigMergeHelper.getProcessEnvironmentConfig(
      name
    );

    const configModule: object = _.defaultsDeep(
      processEnvironmentConfigOfModule,
      applicationConfigOfModule,
      baseConfigModule
    );

    ConfigMergeHelper.checkForMissingConfigProperties(name, configModule);

    this._config[name] = configModule;
  }

  public registerConfig(name: string, configDirectory: string): object {
    const baseConfigModule: object = this._getConfigFromConfigFiles(
      configDirectory
    );
    this._applyConfigModule(name, baseConfigModule);
    return this.getConfig(name);
  }

  public registerApplicationConfigModule(name: string): object {
    this._applyConfigModule(name, {});
    return this.getConfig(name);
  }

  public getConfig(name: string): object {
    if (!_.has(this._config, name)) {
      throw new Error(`config.module.not.found module name: ${name}`);
    }
    return _.cloneDeep(this._config[name]);
  }

  public dangerouslyGetWholeConfig(): object {
    return _.cloneDeep(this._config);
  }
}
