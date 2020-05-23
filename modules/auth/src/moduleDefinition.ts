import { SoniqModule, IModuleConfig, SoniqAppConfigOverwrite, IAppConfig } from "soniq";
import { IAuthApplicationConfigOverwrite, IAuthApplicationConfigOverwriteOptional } from "./interfaces";
import _ from "lodash";

export class AuthModule extends SoniqModule {
  private _authConfig: IAuthApplicationConfigOverwrite;

  public constructor(authConfig: IAuthApplicationConfigOverwrite) {
    super("Auth");

    this._authConfig = authConfig;
  }

  public _build(): IModuleConfig {
    return {
      key: this.getModuleKey(),
      appConfig: this._authConfig,
    };
  }
}

export class AuthModuleOverwrite extends SoniqAppConfigOverwrite {
  private _authConfigOverwrite: IAuthApplicationConfigOverwriteOptional;

  public constructor(authConfigOverwrite: IAuthApplicationConfigOverwriteOptional) {
    super();

    this._authConfigOverwrite = authConfigOverwrite;
  }

  public _build(appConfig: IAppConfig): IAppConfig {
    const authModuleIndex: number = appConfig.modules.findIndex((moduleAppConfig: IModuleConfig) => {
      return moduleAppConfig.key === "Auth";
    });

    appConfig.modules[authModuleIndex].appConfig = _.defaultsDeep(
      appConfig.modules[authModuleIndex].appConfig,
      this._authConfigOverwrite
    );

    return appConfig;
  }
}
