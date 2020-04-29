import { ILogger } from "@fullstack-one/logger";
import { Pool } from "@fullstack-one/core";

import QueryBuilder from "./QueryBuilder";
import MutationBuilder from "./MutationBuilder";
import getDefaultQueryResolver from "./getDefaultQueryResolver";
import getDefaultMutationResolver from "./getDefaultMutationResolver";
import { ICustomResolverObject } from "../resolverTransactions";
import { IDefaultResolverMeta } from "../RuntimeInterfaces";
import { OperatorsBuilder } from "../logicalOperators";
import { HookManager } from "../hooks";

export * from "./types";

export default function getDefaultResolvers(
  operatorsBuilder: OperatorsBuilder,
  defaultResolverMeta: IDefaultResolverMeta,
  hookManager: HookManager,
  pgPool: Pool,
  logger: ILogger
): ICustomResolverObject {
  const queryBuilder = new QueryBuilder(operatorsBuilder, defaultResolverMeta);
  const mutationBuilder = new MutationBuilder(defaultResolverMeta);

  const queryResolver = getDefaultQueryResolver(logger, hookManager, queryBuilder, pgPool);
  const mutationResolver = getDefaultMutationResolver(logger, hookManager, queryBuilder, mutationBuilder);

  return {
    "@fullstack-one/graphql/queryResolver": queryResolver,
    "@fullstack-one/graphql/mutationResolver": mutationResolver
  };
}
