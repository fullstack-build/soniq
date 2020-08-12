import { Logger } from "soniq";
import { Koa } from "@soniq/server";

import { createMiddleware } from "./createMiddleware";
import { TGetSchema } from "../interfaces";

export async function applyMiddleware(app: Koa, getSchema: TGetSchema, logger: Logger): Promise<void> {
  let gqlMiddleware: Koa.Middleware | null = null;

  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    const { schema, runtimeConfig, hasBeenUpdated } = await getSchema("GQL_ENDPOINT"); // IRuntimeConfigGql

    if (ctx.request.path !== (runtimeConfig.options.endpointPath || "/graphql")) {
      return next();
    }

    if (gqlMiddleware == null || hasBeenUpdated === true) {
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
