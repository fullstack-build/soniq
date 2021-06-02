/* eslint-disable @typescript-eslint/naming-convention */
import { SoniqModule, IModuleConfig, SoniqAppConfigOverwrite, IAppConfig } from "soniq";
import { IAuthAppConfig, IAuthAppConfigDefaults, IAuthAppConfigInput, IAuthAppConfigOptional } from "./interfaces";
import * as _ from "lodash";
import { Auth } from "..";
import { defaultAppConfig } from "./defaultAppConfig";

export class AuthModule extends SoniqModule {
  private _authConfig: IAuthAppConfigInput;

  public constructor(authConfig: IAuthAppConfigInput) {
    super("Auth");
    this._authConfig = authConfig;
  }

  public _getDiModule(): typeof Auth {
    return Auth;
  }

  public _build(): IModuleConfig {
    const config: IAuthAppConfigDefaults = _.defaultsDeep(this._authConfig, defaultAppConfig) as IAuthAppConfigDefaults;

    for (const secretKey of Object.keys(config.secrets)) {
      if (config.secrets[secretKey] == null) {
        throw new Error(`AuthConfig secret ${secretKey} is required.`);
      }
    }

    const appConfig: IAuthAppConfig = config as IAuthAppConfig;

    return {
      key: this.getModuleKey(),
      appConfig,
    };
  }
}

export class AuthModuleOverwrite extends SoniqAppConfigOverwrite {
  private _appConfigOverwrite: IAuthAppConfigOptional;

  public constructor(appConfigOverwrite: IAuthAppConfigOptional) {
    super();

    this._appConfigOverwrite = appConfigOverwrite;
  }

  public _build(appConfig: IAppConfig): IAppConfig {
    const authModuleIndex: number = appConfig.modules.findIndex((moduleAppConfig: IModuleConfig) => {
      return moduleAppConfig.key === "Auth";
    });

    appConfig.modules[authModuleIndex].appConfig = _.defaultsDeep(
      appConfig.modules[authModuleIndex].appConfig,
      this._appConfigOverwrite
    );

    return appConfig;
  }
}
