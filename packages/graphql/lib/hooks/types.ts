import { GraphQLResolveInfo } from "graphql";

import { IResolverMeta, IDbMeta } from "@fullstack-one/schema-builder";
import { PostgresQueryRunner } from "@fullstack-one/db";

import { IDefaultMutationResolverContext, IMatch, IQueryBuildOject, IMutationBuildObject } from "../getDefaultResolvers";

export type TPreQueryHookFunction = (
  queryRunner: PostgresQueryRunner,
  context: any,
  authRequired: boolean,
  buildObject: IMutationBuildObject | IQueryBuildOject
) => any;
export type TPreMutationCommitHookFunction<TReturnData, TSource> = (
  queryRunner: PostgresQueryRunner,
  hookInfo: IHookInfo<TReturnData, TSource>
) => any;
export type TPostMutationHookFunction<TReturnData, TSource> = (
  hookInfo: IHookInfo<TReturnData, TSource>,
  context: IDefaultMutationResolverContext,
  info: GraphQLResolveInfo,
  overwriteReturnData: (returnData: any) => any
) => any;

export interface IHookInfo<TReturnData, TSource> {
  returnData: TReturnData;
  returnQuery?: IQueryBuildOject;
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
  mutationQuery: IMutationBuildObject;
}
