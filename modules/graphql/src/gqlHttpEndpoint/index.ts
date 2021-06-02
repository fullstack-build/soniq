import { Logger } from "soniq";
import { Koa } from "@soniq/server";

import { createMiddleware } from "./createMiddleware";
import { IGraphqlAppConfig } from "../moduleDefinition/interfaces";
import { GraphQLSchema } from "graphql";

export async function applyMiddleware(
  app: Koa,
  schema: GraphQLSchema,
  appConfig: IGraphqlAppConfig,
  logger: Logger
): Promise<void> {
  let gqlMiddleware: Koa.Middleware | null = null;

  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    if (ctx.request.path !== (appConfig.options.endpointPath || "/graphql")) {
      return next();
    }

    if (gqlMiddleware == null) {
      // eslint-disable-next-line require-atomic-updates
      gqlMiddleware = createMiddleware(
        schema,
        appConfig.options.introspectionActive !== true,
        appConfig.options.dangerouslyExposeErrorDetails === true,
        logger
      );
    }

    return await gqlMiddleware(ctx, next);
  });
}
