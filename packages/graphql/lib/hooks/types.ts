import { GraphQLResolveInfo } from "graphql";

import { IResolverMeta, IDbMeta } from "@fullstack-one/schema-builder";
import { PgPoolClient } from "@fullstack-one/db";

import { IQueryBuild, IMutationBuild } from "../queryBuilder/sqlGenerator/types";
import { IDefaultMutationResolverContext, IMatch } from "../queryBuilder/types";

export type TPreQueryHookFunction = (client: PgPoolClient, context: any, authRequired: boolean) => any;
export type TPreMutationCommitHookFunction<TReturnData, TSource> = (client: PgPoolClient, hookInfo: IHookInfo<TReturnData, TSource>) => any;
export type TPostMutationHookFunction<TReturnData, TSource> = (
  hookInfo: IHookInfo<TReturnData, TSource>,
  context: IDefaultMutationResolverContext,
  info: GraphQLResolveInfo
) => any;

interface IHookObject {
  preQuery: TPreQueryHookFunction[];
  preMutationCommit: Array<TPreMutationCommitHookFunction<any, any>>;
  postMutation: Array<TPostMutationHookFunction<any, any>>;
}

interface IPreQueryHookConfig {
  type: "preQuery";
  hook: TPreQueryHookFunction;
}

interface IPreMutationCommitHookConfig<TReturnData, TSource> {
  type: "preMutationCommit";
  hook: TPreMutationCommitHookFunction<TReturnData, TSource>;
}

interface IPostMutationCommitHookConfig<TReturnData, TSource> {
  type: "postMutation";
  hook: TPostMutationHookFunction<TReturnData, TSource>;
}

export type IHookConfig = IPreQueryHookConfig | IPreMutationCommitHookConfig<any, any> | IPostMutationCommitHookConfig<any, any>;

export interface IHookInfo<TReturnData, TSource> {
  returnData: TReturnData;
  returnQuery?: IQueryBuild;
  entityId: any;
  type: any;
  obj: TSource;
  args: {
    [argument: string]: any;
  };
  context: IDefaultMutationResolverContext;
  info: GraphQLResolveInfo;
  isAuthenticated: boolean;
  match?: IMatch;
  resolverMeta: IResolverMeta;
  dbMeta: IDbMeta;
  mutationQuery: IMutationBuild;
}
