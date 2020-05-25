import { IGraphqlOptions } from "./moduleDefinition/interfaces";

export interface IGraphqlRuntimeConfig {
  gqlTypeDefs: string;
  resolvers: IResolver[];
  defaultResolverMeta: IDefaultResolverMeta;
  options: IGraphqlOptions;
}

export interface IResolver {
  path: string; // e.g. Query.users, Mutation.createUser, User.stripeAccount
  key: string; // e.g. one/auth/createUserAuthentication
  config: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface IDefaultResolverMeta {
  viewsSchemaName: string;
  query: {
    [name: string]: IQueryViewMeta;
  };
  mutation: {
    [name: string]: IMutationViewMeta;
  };
}

export interface IQueryViewMeta {
  name: string;
  publicViewName: string;
  authViewName: string;
  rootViewName: string;
  fields: IQueryFields;
  disallowGenericRootLevelAggregation: boolean;
}

export interface IQueryFields {
  [fieldName: string]: IQueryFieldMeta;
}

export interface IQueryFieldMeta {
  fieldName: string;
  columnName: string | null;
  columnSelectExpressionTemplate: string | null;
  authRequired: boolean;
  rootOnlyColumn: boolean;
  manyToOne?: {
    foreignColumnName: string;
  };
  oneToMany?: {
    foreignColumnName: string;
  };
}

export interface IMutationViewMeta {
  name: string;
  viewName: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  authRequired: boolean;
  returnOnlyId: boolean;
}

export interface IQueryPermissionGeneratorResult {
  views: IPgView[];
  gqlTypeDefs: string;
  resolvers: IResolver[];
  queryViewMeta: IQueryViewMeta;
}

export interface IMutationPermissionGeneratorResult {
  views: IPgView[];
  gqlTypeDefs: string;
  resolvers: IResolver[];
  mutationViewMeta: IMutationViewMeta;
}

export interface IPgView {
  name: string;
  sql: string;
}

export interface IMutationsMeta {
  views: IPgView[];
  gqlTypeDefs: string;
  resolvers: IResolver[];
  mutationViewMetas: IMutationViewMeta[];
}

export interface IGetAuthModuleRuntimeConfigResult {
  runtimeConfig: IGraphqlRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetGraphqlModuleRuntimeConfig = (updateKey?: string) => Promise<IGetAuthModuleRuntimeConfigResult>;
