import { defaultAppConfig } from "./defaultAppConfig";
import { SoniqModule, IModuleConfig } from "soniq";
import { GraphqlPlayground } from "..";
import { IGraphqlPlaygroundAppConfig, IGraphqlPlaygroundAppConfigInput } from "./interfaces";

export class GraphqlPlaygroundModule extends SoniqModule {
  private _appConfig: IGraphqlPlaygroundAppConfig;

  public constructor(appConfig: IGraphqlPlaygroundAppConfigInput) {
    super("GraphqlPlayground");

    this._appConfig = {
      ...defaultAppConfig,
      ...appConfig,
    };
  }

  public _getDiModule(): typeof GraphqlPlayground {
    return GraphqlPlayground;
  }

  public _build(): IModuleConfig {
    return {
      key: this.getModuleKey(),
      appConfig: this._appConfig,
    };
  }
}
