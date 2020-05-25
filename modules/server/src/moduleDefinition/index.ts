import { SoniqModule, IModuleConfig } from "soniq";
import { IServerAppConfigOptional } from "../interfaces";

export class ServerModule extends SoniqModule {
  private _appConfig: IServerAppConfigOptional;

  public constructor(appConfig: IServerAppConfigOptional) {
    super("Server");

    this._appConfig = appConfig;
  }

  public _build(): IModuleConfig {
    return {
      key: this.getModuleKey(),
      appConfig: this._appConfig,
    };
  }
}
