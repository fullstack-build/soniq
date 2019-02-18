import { IFieldResolver } from "graphql-tools";

import { IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";
import { ILogger } from "@fullstack-one/logger";
import { DbGeneralPool } from "@fullstack-one/db";

import { ICustomResolverObject, ICustomFieldResolver } from "../resolvers";
import QueryBuilder from "./sqlGenerator/QueryBuilder";
import MutationBuilder from "./sqlGenerator/MutationBuilder";
import getDefaultQueryResolver from "./getDefaultQueryResolver";
import getDefaultMutationResolver from "./getDefaultMutationResolver";

export default function getDefaultResolvers(
  resolverMeta: IResolverMeta,
  dbMeta: IDbMeta,
  dbGeneralPool: DbGeneralPool,
  logger: ILogger,
  costLimit: number,
  minQueryDepthToCheckCostLimit: number
): ICustomResolverObject<any, any, any> {
  const queryBuilder = new QueryBuilder(resolverMeta, dbMeta, minQueryDepthToCheckCostLimit);
  const mutationBuilder = new MutationBuilder(resolverMeta);

  const queryResolver = getDefaultQueryResolver(dbGeneralPool, logger, queryBuilder, costLimit);
  const mutationResolver = getDefaultMutationResolver(dbGeneralPool, logger, queryBuilder, mutationBuilder, costLimit, resolverMeta, dbMeta);

  return {
    "@fullstack-one/graphql/queryResolver": asCustomResolver(queryResolver),
    "@fullstack-one/graphql/mutationResolver": asCustomResolver(mutationResolver)
  };
}

function asCustomResolver<TSource, TContext>(resolver: IFieldResolver<TSource, TContext>): ICustomFieldResolver<TSource, TContext, any> {
  return (source, args, context, info, operationParams) => resolver(source, args, context, info);
}
