import { IFieldResolver } from "graphql-tools";

import { DbGeneralPool, PgPoolClient } from "@fullstack-one/db";
import { Container } from "@fullstack-one/di";
import { ILogger } from "@fullstack-one/logger";

import QueryBuilder from "./QueryBuilder";
import checkCosts from "./checks/checkCosts";
import checkQueryResultForInjection from "./checks/checkQueryResultForInjection";
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

    const queryBuild = queryBuilder.build(info, isAuthenticated);

    const client: PgPoolClient = await dbGeneralPool.pgPool.connect();

    try {
      await client.query("BEGIN");

      setAuthRequiredInKoaStateForCacheHeaders(context, queryBuild.authRequired);

      await hookManager.executePreQueryHooks(client, context, queryBuild.authRequired);

      logger.trace("queryResolver.run", queryBuild.sql, queryBuild.values);

      if (queryBuild.potentialHighCost === true) {
        const currentCost = await checkCosts(client, queryBuild, costLimit);
        logger.warn(
          "The current query has been identified as potentially too expensive and could get denied in case the data set gets bigger." +
            ` Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${queryBuild.maxDepth})`
        );
      }

      const result = await client.query(queryBuild.sql, queryBuild.values);
      checkQueryResultForInjection(result, logger);

      const { rows } = result;
      const data = rows[0][queryBuild.queryName];

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

function setAuthRequiredInKoaStateForCacheHeaders(context: any, authRequired: boolean) {
  if (context.accessToken != null && authRequired) {
    context.ctx.state.authRequired = true;
  }
}
