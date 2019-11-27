export interface IRuntimeConfigCore {
  gqlTypeDefs: string;
  resolvers: IResolver[];
  defaultResolverMeta: IDefaultResolverMeta;
}

export interface IResolver {
  path: string; // e.g. Query.users, Mutation.createUser, User.stripeAccount
  key: string; // e.g. one/auth/createUserAuthentication
  config: {
    [key: string]: any;
  };
}

export interface IDefaultResolverMeta {
  viewsSchemaName: string;
  costLimit: number;
  minSubqueryCountToCheckCostLimit: number;
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
  fields: IQueryFields;
  disallowGenericRootLevelAggregation: boolean;
}

export interface IQueryFields {
  [fieldName: string]: IQueryFieldMeta;
}

export interface IQueryFieldMeta {
  fieldName: string;
  columnName: string | null;
  authRequired: boolean;
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
