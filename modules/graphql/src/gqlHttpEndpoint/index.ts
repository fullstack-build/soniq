import { GraphQLSchema } from "graphql";

import { Logger } from "soniq";
import { Koa } from "@soniq/server";
import { Pool } from "soniq";
import { IGraphqlRuntimeConfig, TGetGraphqlModuleRuntimeConfig, IResolverMapping } from "../RuntimeInterfaces";
import getDefaultResolvers from "../getDefaultResolvers";
import { getResolvers, ICustomResolverObject } from "../resolverTransactions";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { HookManager } from "../hooks";
import { OperatorsBuilder } from "../logicalOperators";
import { IResolvers } from "@graphql-tools/utils";

import { createMiddleware } from "./createMiddleware";
import { IRuntimeExtension, TGetRuntimeExtensions, IGetRuntimeExtensionsResult } from "../interfaces";

async function makeSchema(
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

export async function applyMiddleware(
  app: Koa,
  getRuntimeConfig: TGetGraphqlModuleRuntimeConfig,
  getRuntimeExtensions: TGetRuntimeExtensions,
  pgPool: Pool,
  diResolvers: ICustomResolverObject,
  logger: Logger,
  hookManager: HookManager,
  operatorsBuilder: OperatorsBuilder
): Promise<void> {
  let gqlMiddleware: Koa.Middleware | null = null;

  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    const { runtimeConfig, hasBeenUpdated } = await getRuntimeConfig("GQL_ENDPOINT"); // IRuntimeConfigGql
    const runtimeExtensionsResult: IGetRuntimeExtensionsResult = getRuntimeExtensions("GQL_ENDPOINT");

    if (ctx.request.path !== (runtimeConfig.options.endpointPath || "/graphql")) {
      return next();
    }

    if (gqlMiddleware == null || hasBeenUpdated === true || runtimeExtensionsResult.hasBeenUpdated === true) {
      const schema: GraphQLSchema = await makeSchema(
        runtimeConfig,
        diResolvers,
        pgPool,
        hookManager,
        logger,
        operatorsBuilder,
        runtimeExtensionsResult.runtimeExtensions
      );

      // eslint-disable-next-line require-atomic-updates
      gqlMiddleware = createMiddleware(
        schema,
        runtimeConfig.options.introspectionActive !== true,
        runtimeConfig.options.dangerouslyExposeErrorDetails === true,
        logger
      );
    }

    return await gqlMiddleware(ctx, next);
  });
}
