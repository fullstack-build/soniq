import { SoniqModule, IModuleConfig, IObjectTrace } from "soniq";
import { GraphQl } from "..";
import { IDbSchema } from "../migration/DbSchemaInterface";
import { defaultAppConfig } from "./defaultAppConfig";
import { IGraphqlOptions, IGraphqlOptionsOptional } from "./interfaces";
import { Schema } from "./schema";

export * from "./schema";
export * from "./table";
export * from "./column";
export * from "./expression";

export class GraphQlModule extends SoniqModule {
  private _schema: Schema;
  private _options: IGraphqlOptions;

  public constructor(schema: Schema, options: IGraphqlOptionsOptional) {
    super("GraphQl");

    this._schema = schema;
    this._options = {
      ...defaultAppConfig,
      ...options,
    };
  }

  public _getDiModule(): typeof GraphQl {
    return GraphQl;
  }

  public _build(appId: string): IModuleConfig {
    const schema: IDbSchema = this._schema._build(appId);

    return {
      key: this.getModuleKey(),
      appConfig: {
        schema,
        options: this._options,
      },
    };
  }

  public _buildObjectTraces(appId: string): IObjectTrace[] {
    return this._schema._buildObjectTraces(appId);
  }
}
