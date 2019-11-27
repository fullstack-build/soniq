import { IFieldResolver } from "graphql-tools";

import { Pool } from "@fullstack-one/core";
import { Container } from "@fullstack-one/di";
import { ILogger } from "@fullstack-one/logger";

import QueryBuilder, { IQueryBuildOject } from "./QueryBuilder";
import checkCosts from "./checks/checkCosts";
import checkQueryResultForInjection from "./checks/checkQueryResultForInjection";
import { HookManager } from "../hooks";
import { ICustomResolverCreator } from "../resolverTransactions";

export default function getDefaultQueryResolver(
  logger: ILogger,
  hookManager: HookManager,
  queryBuilder: QueryBuilder,
  pgPool: Pool
): ICustomResolverCreator {
  return (resolver) => {
    return {
      usesPgClientFromContext: false,
      resolver: async (obj, args, context, info, returnIdHandler) => {
        const isAuthenticated = context.accessToken != null;

        const queryBuild: IQueryBuildOject = queryBuilder.build(info, isAuthenticated || process.env.FAKE_AUTHENTICATION_FOR_QUERIES === "true");

        const pgClient = await pgPool.connect();

        try {
          await pgClient.query("BEGIN;");

          setAuthRequiredInKoaStateForCacheHeaders(context, queryBuild.authRequired);

          await hookManager.executePreQueryHooks(pgClient, context, queryBuild.authRequired, queryBuild);

          logger.trace("queryResolver.run", queryBuild.sql, queryBuild.values);

          await checkCosts(pgClient, queryBuild, queryBuilder.getCostLimit());

          const result = await pgClient.query(queryBuild.sql, queryBuild.values);
          checkQueryResultForInjection(result.rows, logger);

          const data = result.rows[0][queryBuild.queryName];

          await pgClient.query("COMMIT;");

          return data;
        } catch (e) {
          await pgClient.query("ROLLBACK;");
          throw e;
        } finally {
          await pgClient.release();
        }
      }
    };
  };
}

function setAuthRequiredInKoaStateForCacheHeaders(context: any, authRequired: boolean) {
  if (context.accessToken != null && authRequired) {
    context.ctx.state.authRequired = true;
  }
}
