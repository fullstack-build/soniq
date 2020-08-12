import { Pool, PoolClient, QueryResult } from "soniq";
import { Logger } from "soniq";

import QueryBuilder, { IQueryBuildObject } from "./QueryBuilder";
import checkCosts from "./checks/checkCosts";
import checkQueryResultForInjection from "./checks/checkQueryResultForInjection";
import { HookManager } from "../hooks";
import { ICustomResolverCreator } from "../resolverTransactions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setAuthRequiredInKoaStateForCacheHeaders(context: any, authRequired: boolean): void {
  if (context.accessToken != null && authRequired && context.ctx != null && context.ctx.state != null) {
    context.ctx.state.authRequired = true;
  }
}

export default function getDefaultQueryResolver(
  logger: Logger,
  hookManager: HookManager,
  queryBuilder: QueryBuilder,
  pgPool: Pool
): ICustomResolverCreator {
  return (resolver) => {
    return {
      usesPgClientFromContext: false,
      resolver: async (obj, args, context, info, returnIdHandler) => {
        const isAuthenticated: boolean = context.accessToken != null;
        const useRootViews: boolean = context.useRootViews === true;

        const queryBuild: IQueryBuildObject = queryBuilder.build(
          info,
          isAuthenticated || process.env.FAKE_AUTHENTICATION_FOR_QUERIES === "true",
          useRootViews
        );

        const useContextPgClient: boolean = context.pgClient != null;

        const pgClient: PoolClient = useContextPgClient ? context.pgClient : await pgPool.connect();

        try {
          // Don't run transaction commands on context pgClients
          if (useContextPgClient !== true) {
            await pgClient.query("BEGIN;");
          }

          setAuthRequiredInKoaStateForCacheHeaders(context, queryBuild.authRequired);

          await hookManager.executePreQueryHooks(
            pgClient,
            context,
            queryBuild.authRequired,
            queryBuild,
            useContextPgClient
          );

          logger.info("queryResolver.run", queryBuild.sql, queryBuild.values);

          await checkCosts(pgClient, queryBuild, queryBuilder.getCostLimit());

          const result: QueryResult = await pgClient.query(queryBuild.sql, queryBuild.values);
          checkQueryResultForInjection(result.rows, logger);

          const data: unknown = result.rows[0][queryBuild.queryName];

          // Don't run transaction commands on context pgClients
          if (useContextPgClient !== true) {
            await pgClient.query("COMMIT;");
          }

          return data;
        } catch (e) {
          // Don't run transaction commands on context pgClients
          if (useContextPgClient !== true) {
            await pgClient.query("ROLLBACK;");
          }
          throw e;
        } finally {
          // Don't run transaction commands on context pgClients
          if (useContextPgClient !== true) {
            await pgClient.release();
          }
        }
      },
    };
  };
}
