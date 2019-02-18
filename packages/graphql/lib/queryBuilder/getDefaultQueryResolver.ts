import { IFieldResolver } from "graphql-tools";

import { DbGeneralPool, PgPoolClient } from "@fullstack-one/db";
import { Container } from "@fullstack-one/di";
import { ILogger } from "@fullstack-one/logger";

import QueryBuilder from "./sqlGenerator/QueryBuilder";
import checkCosts from "./checkCosts";
import checkQueryResultForInjection from "./checkQueryResultForInjection";
import { HookManager } from "../hooks";

const hookManager: HookManager = Container.get(HookManager);

export default function getDefaultQueryResolver(
  dbGeneralPool: DbGeneralPool,
  logger: ILogger,
  queryBuilder: QueryBuilder,
  costLimit: number
): IFieldResolver<any, any> {
  return async (obj, args, context, info) => {
    const isAuthenticated = context.accessToken != null;

    const selectQuery = queryBuilder.build(info, isAuthenticated);

    const client: PgPoolClient = await dbGeneralPool.pgPool.connect();

    try {
      await client.query("BEGIN");

      // Set authRequired in koa state for cache headers
      if (context.accessToken != null && selectQuery.authRequired) {
        context.ctx.state.authRequired = true;
      }

      await hookManager.executePreQueryHooks(client, context, selectQuery.authRequired);

      logger.trace("queryResolver.run", selectQuery.sql, selectQuery.values);

      if (selectQuery.potentialHighCost === true) {
        const currentCost = await checkCosts(client, selectQuery, costLimit);
        logger.warn(
          "The current query has been identified as potentially too expensive and could get denied in case the data set gets bigger." +
            ` Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${selectQuery.maxDepth})`
        );
      }

      const result = await client.query(selectQuery.sql, selectQuery.values);
      checkQueryResultForInjection(result, logger);

      const { rows } = result;
      // Read JSON data from first row
      const data = rows[0][selectQuery.query.name];

      await client.query("COMMIT");

      return data;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  };
}
