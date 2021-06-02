import { GraphQLSchema } from "graphql";

import { Logger } from "soniq";
import { Pool } from "soniq";
import { IResolverMapping } from "../moduleDefinition/RuntimeInterfaces";
import getDefaultResolvers from "../getDefaultResolvers";
import { getResolvers, ICustomResolverObject } from "../resolverTransactions";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { HookManager } from "../hooks";
import { OperatorsBuilder } from "../logicalOperators";
import { IResolvers } from "@graphql-tools/utils";
import { IGraphqlAppConfig, IGraphqlRunConfig } from "../moduleDefinition/interfaces";

export async function makeSchema(
  runConfig: IGraphqlRunConfig,
  appConfig: IGraphqlAppConfig,
  diResolvers: ICustomResolverObject,
  pgPool: Pool,
  hookManager: HookManager,
  logger: Logger,
  operatorsBuilder: OperatorsBuilder,
  runtimeResolverMappings: IResolverMapping[],
  runtimeSchemaExtensions: string[]
): Promise<GraphQLSchema> {
  const defaultResolvers: ICustomResolverObject = getDefaultResolvers(
    operatorsBuilder,
    runConfig.defaultResolverMeta,
    hookManager,
    pgPool,
    logger,
    appConfig
  );

  let typeDefs: string = runConfig.gqlTypeDefs;

  const runtimeResolvers: ICustomResolverObject = { ...defaultResolvers, ...diResolvers };

  const resolverMappings: IResolverMapping[] = runConfig.resolverMappings;

  runtimeSchemaExtensions.forEach((schemaExtension: string) => {
    typeDefs += `\n${schemaExtension}`;
  });

  runtimeResolverMappings.forEach((resolverMapping: IResolverMapping) => {
    resolverMappings.push(resolverMapping);
  });

  const resolvers: IResolvers = getResolvers(resolverMappings, runtimeResolvers, pgPool, logger);
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
}
