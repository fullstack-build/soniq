import { IFieldResolver } from "graphql-tools";

import { DbGeneralPool } from "@fullstack-one/db";
import { ILogger } from "@fullstack-one/logger";

import { IHookObject } from "./types";
import QueryBuilder from "./sqlGenerator/QueryBuilder";
import checkCosts from "./checkCosts";
import checkQueryResultForInjection from "./checkQueryResultForInjection";

export default function getDefaultQueryResolver(
  dbGeneralPool: DbGeneralPool,
  logger: ILogger,
  queryBuilder: QueryBuilder,
  hookObject: IHookObject,
  costLimit: number
): IFieldResolver<any, any> {
  return async (obj, args, context, info) => {
    let isAuthenticated = false;
    if (context.accessToken != null) {
      isAuthenticated = true;
    }
    // Generate select sql query
    const selectQuery = queryBuilder.build(info, isAuthenticated);

    const client = await dbGeneralPool.pgPool.connect();

    try {
      await client.query("BEGIN");

      // Set authRequired in koa state for cache headers
      if (context.accessToken != null && selectQuery.authRequired) {
        context.ctx.state.authRequired = true;
      }

      // PreQueryHook (for auth)
      for (const fn of hookObject.preQuery) {
        await fn(client, context, selectQuery.authRequired);
      }

      logger.trace("queryResolver.run", selectQuery.sql, selectQuery.values);

      if (selectQuery.potentialHighCost === true) {
        const currentCost = await checkCosts(client, selectQuery, costLimit);
        logger.warn(
          "The current query has been identified as potentially too expensive and could get denied in case the data set gets bigger." +
            ` Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${selectQuery.maxDepth})`
        );
      }

      // Run query against pg to get data
      const result = await client.query(selectQuery.sql, selectQuery.values);
      checkQueryResultForInjection(result, logger);

      const { rows } = result;
      // Read JSON data from first row
      const data = rows[0][selectQuery.query.name];

      // Commit transaction
      await client.query("COMMIT");

      // Respond data it to pgClient
      return data;
    } catch (e) {
      // Rollback on any error
      await client.query("ROLLBACK");
      throw e;
    } finally {
      // Release pgClient to pool
      client.release();
    }
  };
}
