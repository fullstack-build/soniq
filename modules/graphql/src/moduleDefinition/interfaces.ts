import { IDbSchema } from "../migration/DbSchemaInterface";
import { IDefaultResolverMeta, IResolverMapping } from "./RuntimeInterfaces";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface IGraphqlOptions {
  endpointPath: string;
  costLimit: number;
  minSubqueryCountToCheckCostLimit: number;
  introspectionActive: boolean;
  dangerouslyExposeErrorDetails: boolean;
}

export type IGraphqlOptionsOptional = DeepPartial<IGraphqlOptions>;

export interface IGraphqlAppConfigInput {
  options: IGraphqlOptionsOptional;
  schema: IDbSchema;
}

export interface IGraphqlAppConfig {
  options: IGraphqlOptions;
  schema: IDbSchema;
}

export interface IGraphqlRunConfig {
  gqlTypeDefs: string;
  resolverMappings: IResolverMapping[];
  defaultResolverMeta: IDefaultResolverMeta;
}
