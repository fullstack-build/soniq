import { Logger } from "soniq";
import { Pool } from "soniq";

import QueryBuilder from "./QueryBuilder";
import MutationBuilder from "./MutationBuilder";
import getDefaultQueryResolver from "./getDefaultQueryResolver";
import getDefaultMutationResolver from "./getDefaultMutationResolver";
import { ICustomResolverObject, ICustomResolverCreator } from "../resolverTransactions";
import { IDefaultResolverMeta } from "../moduleDefinition/RuntimeInterfaces";
import { OperatorsBuilder } from "../logicalOperators";
import { HookManager } from "../hooks";
import { IGraphqlAppConfig } from "../moduleDefinition/interfaces";

export * from "./types";

export default function getDefaultResolvers(
  operatorsBuilder: OperatorsBuilder,
  defaultResolverMeta: IDefaultResolverMeta,
  hookManager: HookManager,
  pgPool: Pool,
  logger: Logger,
  appConfig: IGraphqlAppConfig
): ICustomResolverObject {
  const queryBuilder: QueryBuilder = new QueryBuilder(operatorsBuilder, defaultResolverMeta, appConfig);
  const mutationBuilder: MutationBuilder = new MutationBuilder(defaultResolverMeta);

  const queryResolver: ICustomResolverCreator = getDefaultQueryResolver(logger, hookManager, queryBuilder, pgPool);
  const mutationResolver: ICustomResolverCreator = getDefaultMutationResolver(
    logger,
    hookManager,
    queryBuilder,
    mutationBuilder
  );

  return {
    "@fullstack-one/graphql/queryResolver": queryResolver,
    "@fullstack-one/graphql/mutationResolver": mutationResolver,
  };
}
