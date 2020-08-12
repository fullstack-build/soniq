import { GraphQLSchema } from "graphql";

import { Logger } from "soniq";
import { Pool } from "soniq";
import { IGraphqlRuntimeConfig, IResolverMapping } from "../RuntimeInterfaces";
import getDefaultResolvers from "../getDefaultResolvers";
import { getResolvers, ICustomResolverObject } from "../resolverTransactions";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { HookManager } from "../hooks";
import { OperatorsBuilder } from "../logicalOperators";
import { IResolvers } from "@graphql-tools/utils";

import { IRuntimeExtension } from "../interfaces";

export async function makeSchema(
  runtimeConfig: IGraphqlRuntimeConfig,
  diResolvers: ICustomResolverObject,
  pgPool: Pool,
  hookManager: HookManager,
  logger: Logger,
  operatorsBuilder: OperatorsBuilder,
  runtimeExtensions: IRuntimeExtension[]
): Promise<GraphQLSchema> {
  const defaultResolvers: ICustomResolverObject = getDefaultResolvers(
    operatorsBuilder,
    runtimeConfig.defaultResolverMeta,
    hookManager,
    pgPool,
    logger,
    runtimeConfig.options
  );

  let typeDefs: string = runtimeConfig.gqlTypeDefs;

  let runtimeResolvers: ICustomResolverObject = { ...defaultResolvers, ...diResolvers };

  const resolverMappings: IResolverMapping[] = runtimeConfig.resolverMappings;

  runtimeExtensions.forEach((runtimeExtension: IRuntimeExtension) => {
    if (runtimeExtension.resolverMappings != null) {
      runtimeExtension.resolverMappings.forEach((resolverMapping: IResolverMapping) => {
        resolverMappings.push(resolverMapping);
      });
    }
    if (runtimeExtension.resolverObject != null) {
      runtimeResolvers = {
        ...runtimeResolvers,
        ...runtimeExtension.resolverObject,
      };
    }
    if (runtimeExtension.schemaExtensions != null) {
      runtimeExtension.schemaExtensions.forEach((schemaExtension: string) => {
        typeDefs += `\n${schemaExtension}`;
      });
    }
  });

  const resolvers: IResolvers = getResolvers(resolverMappings, runtimeResolvers, pgPool, logger);
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
}
