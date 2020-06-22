import { IFieldResolver } from "graphql-tools";

import { IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";
import { Logger } from "@fullstack-one/logger";
import { ORM } from "@fullstack-one/db";

import { ICustomResolverObject, ICustomFieldResolver } from "../resolvers";
import QueryBuilder from "./QueryBuilder";
import MutationBuilder from "./MutationBuilder";
import getDefaultQueryResolver from "./getDefaultQueryResolver";
import getDefaultMutationResolver from "./getDefaultMutationResolver";
import { getBeginTransactionResolver, getCommitTransactionResolver } from "./getTransactionMutationResolvers";

export * from "./types";

export default function getDefaultResolvers(
  resolverMeta: IResolverMeta,
  dbMeta: IDbMeta,
  orm: ORM,
  logger: Logger,
  costLimit: number,
  minQueryDepthToCheckCostLimit: number
): ICustomResolverObject<any, any, any> {
  const queryBuilder = new QueryBuilder(resolverMeta, dbMeta, minQueryDepthToCheckCostLimit);
  const mutationBuilder = new MutationBuilder(resolverMeta);

  const queryResolver = getDefaultQueryResolver(orm, logger, queryBuilder, costLimit);
  const mutationResolver = getDefaultMutationResolver(orm, logger, queryBuilder, mutationBuilder, costLimit, resolverMeta, dbMeta);
  const beginTransactionResolver = getBeginTransactionResolver(orm, logger);
  const commitTransactionResolver = getCommitTransactionResolver(orm, logger);

  return {
    "@fullstack-one/graphql/queryResolver": asCustomResolver(queryResolver),
    "@fullstack-one/graphql/mutationResolver": asCustomResolver(mutationResolver),
    "@fullstack-one/graphql/beginTransactionResolver": asCustomResolver(beginTransactionResolver),
    "@fullstack-one/graphql/commitTransactionResolver": asCustomResolver(commitTransactionResolver)
  };
}

function asCustomResolver<TSource, TContext>(resolver: ICustomFieldResolver<TSource, TContext, any>): ICustomFieldResolver<TSource, TContext, any> {
  return (source, args, context, info, operationParams, returnIdHandler) => resolver(source, args, context, info, operationParams, returnIdHandler);
}
