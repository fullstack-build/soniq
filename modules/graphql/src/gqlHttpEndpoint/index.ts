import { GraphQLSchema } from "graphql";

import { Logger } from "soniq";
import { Koa } from "@soniq/server";
import { Pool } from "soniq";
import { IGraphqlRuntimeConfig, TGetGraphqlModuleRuntimeConfig } from "../RuntimeInterfaces";
import getDefaultResolvers from "../getDefaultResolvers";
import { getResolvers, ICustomResolverObject, ICustomResolverCreator } from "../resolverTransactions";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { HookManager } from "../hooks";
import { OperatorsBuilder } from "../logicalOperators";
import { IResolvers } from "@graphql-tools/utils";

import { createMiddleware } from "./createMiddleware";

async function makeSchema(
  runtimeConfig: IGraphqlRuntimeConfig,
  diResolvers: ICustomResolverObject,
  pgPool: Pool,
  hookManager: HookManager,
  logger: Logger,
  operatorsBuilder: OperatorsBuilder
): Promise<GraphQLSchema> {
  const defaultResolvers: ICustomResolverObject = getDefaultResolvers(
    operatorsBuilder,
    runtimeConfig.defaultResolverMeta,
    hookManager,
    pgPool,
    logger,
    runtimeConfig.options
  );

  const runtimeResolvers: {
    [x: string]: ICustomResolverCreator;
  } = { ...defaultResolvers, ...diResolvers };

  const resolvers: IResolvers = getResolvers(runtimeConfig.resolvers, runtimeResolvers, pgPool, logger);
  return makeExecutableSchema({
    typeDefs: runtimeConfig.gqlTypeDefs,
    resolvers,
  });
}

export async function applyMiddleware(
  app: Koa,
  getRuntimeConfig: TGetGraphqlModuleRuntimeConfig,
  pgPool: Pool,
  diResolvers: ICustomResolverObject,
  logger: Logger,
  hookManager: HookManager,
  operatorsBuilder: OperatorsBuilder
): Promise<void> {
  let gqlMiddleware: Koa.Middleware | null = null;

  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    const { runtimeConfig, hasBeenUpdated } = await getRuntimeConfig("GQL_ENDPOINT"); // IRuntimeConfigGql

    if (ctx.request.path !== (runtimeConfig.options.endpointPath || "/graphql")) {
      return next();
    }

    if (gqlMiddleware == null || hasBeenUpdated === true) {
      const schema: GraphQLSchema = await makeSchema(
        runtimeConfig,
        diResolvers,
        pgPool,
        hookManager,
        logger,
        operatorsBuilder
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
