import { SoniqModule, IModuleConfig } from "soniq";
import { IGraphqlPlaygroundAppConfigOptional } from "../interfaces";

export class GraphqlPlaygroundModule extends SoniqModule {
  private _appConfig: IGraphqlPlaygroundAppConfigOptional;

  public constructor(appConfig: IGraphqlPlaygroundAppConfigOptional) {
    super("GraphqlPlayground");

    this._appConfig = appConfig;
  }

  public _build(): IModuleConfig {
    return {
      key: this.getModuleKey(),
      appConfig: this._appConfig,
    };
  }
}
