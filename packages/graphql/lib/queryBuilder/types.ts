import { IQueryBuild, IMutationBuild } from "./sqlGenerator/types";
import { GraphQLResolveInfo } from "graphql";
import { IResolverMeta, IDbMeta } from "@fullstack-one/schema-builder";
import { PgPoolClient } from "@fullstack-one/db";

export type TPreQueryHookFunction = (client: PgPoolClient, context: any, authRequired: boolean) => any;
export type TPreMutationCommitHookFunction<TReturnData, TSource> = (client: PgPoolClient, hookInfo: IHookInfo<TReturnData, TSource>) => any;
export type TPostMutationHookFunction<TReturnData, TSource> = (
  hookInfo: IHookInfo<TReturnData, TSource>,
  context: IDefaultMutationResolverContext,
  info: GraphQLResolveInfo
) => any;

export interface IHookObject {
  preQuery: TPreQueryHookFunction[];
  preMutationCommit: Array<TPreMutationCommitHookFunction<any, any>>;
  postMutation: Array<TPostMutationHookFunction<any, any>>;
}

export interface IDefaultMutationResolverContext {
  accessToken: string | null;
  ctx: {
    state: {
      includesMutation: boolean;
    };
  };
}

export interface IMatch {
  type: "SIMPLE" | "ARRAY";
  foreignFieldName: string;
  fieldExpression: string;
}

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
