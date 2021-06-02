import { SoniqModule, IModuleConfig } from "soniq";
import { Server } from "..";
import { defaultAppConfig } from "./defaultAppConfig";
import { IServerAppConfig, IServerAppConfigInput } from "./interfaces";

export class ServerModule extends SoniqModule {
  private _appConfig: IServerAppConfig;

  public constructor(appConfig: IServerAppConfigInput) {
    super("Server");

    this._appConfig = {
      ...defaultAppConfig,
      ...appConfig,
    };
  }

  public _getDiModule(): typeof Server {
    return Server;
  }

  public _build(): IModuleConfig {
    return {
      key: this.getModuleKey(),
      appConfig: this._appConfig,
    };
  }
}
