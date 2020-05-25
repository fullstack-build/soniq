import { SoniqModule, IModuleConfig } from "soniq";
import { IDbSchema } from "../migration/DbSchemaInterface";
import { IGraphqlAppConfigInput } from "./interfaces";

export * from "./schema";
export * from "./table";
export * from "./column";
export * from "./expression";

export class GraphQlModule extends SoniqModule {
  private _appConfig: IGraphqlAppConfigInput;

  public constructor(appConfig: IGraphqlAppConfigInput) {
    super("GraphQl");

    this._appConfig = appConfig;
  }

  public _build(appId: string): IModuleConfig {
    const schema: IDbSchema = this._appConfig.schema._build(appId);

    return {
      key: this.getModuleKey(),
      appConfig: {
        schema,
        options: this._appConfig.options,
      },
    };
  }
}
