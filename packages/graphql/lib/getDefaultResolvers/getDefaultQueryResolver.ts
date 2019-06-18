import { IFieldResolver } from "graphql-tools";

import { ORM, PostgresQueryRunner } from "@fullstack-one/db";
import { Container } from "@fullstack-one/di";
import { ILogger } from "@fullstack-one/logger";

import QueryBuilder, { IQueryBuildOject } from "./QueryBuilder";
import checkCosts from "./checks/checkCosts";
import checkQueryResultForInjection from "./checks/checkQueryResultForInjection";
import { HookManager } from "../hooks";

const hookManager: HookManager = Container.get(HookManager);

export default function getDefaultQueryResolver(orm: ORM, logger: ILogger, queryBuilder: QueryBuilder, costLimit: number): IFieldResolver<any, any> {
  return async (obj, args, context, info) => {
    const isAuthenticated = context.accessToken != null;

    const queryBuild: IQueryBuildOject = queryBuilder.build(info, isAuthenticated);

    const queryRunner = orm.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      setAuthRequiredInKoaStateForCacheHeaders(context, queryBuild.authRequired);

      await hookManager.executePreQueryHooks(queryRunner, context, queryBuild.authRequired, queryBuild);

      logger.trace("queryResolver.run", queryBuild.sql, queryBuild.values);

      if (queryBuild.potentialHighCost === true) {
        const currentCost = await checkCosts(queryRunner, queryBuild, costLimit);
        logger.debug(
          "The current query has been identified as potentially too expensive and could get denied in case the data set gets bigger." +
            ` Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${queryBuild.maxDepth})`
        );
      }

      const result = await queryRunner.query(queryBuild.sql, queryBuild.values);
      checkQueryResultForInjection(result, logger);

      const data = result[0][queryBuild.queryName];

      await queryRunner.commitTransaction();

      return data;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  };
}

function setAuthRequiredInKoaStateForCacheHeaders(context: any, authRequired: boolean) {
  if (context.accessToken != null && authRequired) {
    context.ctx.state.authRequired = true;
  }
}
