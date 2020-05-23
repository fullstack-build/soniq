import { Schema } from "./schema";
import { IDbSchema } from "../migration/DbSchemaInterface";

export interface IGraphqlOptions {
  endpointPath: string;
  costLimit: number;
  minSubqueryCountToCheckCostLimit: number;
  playgroundActive: boolean;
  introspectionActive: boolean;
}

export interface IGraphqlOptionsInput {
  endpointPath?: string;
  costLimit?: number;
  minSubqueryCountToCheckCostLimit?: number;
  playgroundActive?: boolean;
  introspectionActive?: boolean;
}

export interface IGraphqlAppConfig {
  schema: IDbSchema;
  options: IGraphqlOptionsInput;
}

export interface IGraphqlAppConfigInput {
  schema: Schema;
  options: IGraphqlOptionsInput;
}
