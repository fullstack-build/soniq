import { IFieldResolver } from "graphql-tools";

import { ORM } from "@fullstack-one/db";
import { Container } from "@fullstack-one/di";
import { ILogger } from "@fullstack-one/logger";
import { IDbMeta, IResolverMeta } from "@fullstack-one/schema-builder";

import { HookManager, IHookInfo } from "../hooks";
import { IDefaultMutationResolverContext, IMatch } from "./types";
import checkCosts from "./checks/checkCosts";
import checkQueryResultForInjection from "./checks/checkQueryResultForInjection";
import MutationBuilder, { IMutationBuildObject } from "./MutationBuilder";
import QueryBuilder, { IQueryBuildOject } from "./QueryBuilder";

const hookManager: HookManager = Container.get(HookManager);

export default function getDefaultMutationResolver<TSource>(
  orm: ORM,
  logger: ILogger,
  queryBuilder: QueryBuilder,
  mutationBuilder: MutationBuilder,
  costLimit: number,
  resolverMeta: IResolverMeta,
  dbMeta: IDbMeta
): IFieldResolver<TSource, IDefaultMutationResolverContext> {
  return async (obj, args, context, info) => {
    const isAuthenticated = context.accessToken != null;

    const mutationBuild: IMutationBuildObject = mutationBuilder.build(info);
    context.ctx.state.includesMutation = true;

    const queryRunner = orm.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await hookManager.executePreQueryHooks(queryRunner, context, context.accessToken != null, mutationBuild);

      logger.trace("mutationResolver.run", mutationBuild.sql, mutationBuild.values);

      const result = await queryRunner.query(mutationBuild.sql, mutationBuild.values);

      if (result.rowCount < 1) {
        throw new Error("No rows affected by this mutation. Either the entity does not exist or you are not permitted.");
      }

      let returnQueryBuild: IQueryBuildOject | undefined;
      let returnData: any;
      let entityId = mutationBuild.id || null;
      let match: IMatch | undefined;

      // Workaround: Postgres does not return id for INSERT without SELECT permission.
      // Therefore we retrieve the last generated UUID in transaction.
      // Our concept allows one one INSERT per transaction.
      if (entityId == null && mutationBuild.mutation.type === "CREATE") {
        const idResult = await queryRunner.query('SELECT "_meta"."get_last_generated_uuid"() AS "id";');
        entityId = idResult[0].id;
      }

      // Check if this mutations returnType is ID
      // e.g. When mutationType is DELETE just return the id. Otherwise query for the new data.
      // e.g. When this is a user-creation the creator has no access to his own user before login.
      // tslint:disable-next-line:prettier
      if (
        mutationBuild.mutation.gqlReturnTypeName === "ID" ||
        (mutationBuild.mutation.extensions != null && mutationBuild.mutation.extensions.returnOnlyId === true)
      ) {
        returnData = entityId;
      } else {
        // Create a match to search for the new created or updated entity
        match = {
          type: "SIMPLE",
          foreignFieldName: "id",
          fieldExpression: `'${entityId}'::uuid`
        };

        // Generate sql query for response-data of the mutation
        returnQueryBuild = queryBuilder.build(info, isAuthenticated, match);

        logger.trace("mutationResolver.returnQuery.run", returnQueryBuild.sql, returnQueryBuild.values);

        if (returnQueryBuild.potentialHighCost === true) {
          const currentCost = await checkCosts(queryRunner, returnQueryBuild, costLimit);
          logger.warn(
            "The current query has been identified as potentially too expensive and could get denied in case the" +
              ` data set gets bigger. Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${returnQueryBuild.maxDepth})`
          );
        }

        // Run SQL query on pg to get response-data
        const returnResult = await queryRunner.query(returnQueryBuild.sql, returnQueryBuild.values);
        checkQueryResultForInjection(returnResult, logger);

        const resultData = returnResult[0][returnQueryBuild.queryName];

        if (resultData.length < 1) {
          throw new Error(
            "The return-query of this mutation has no entries. Perhaps you are not permitted to access the results." +
              " You can set 'returnOnlyId' on the permission-view to be able to run this mutation without changing read-permissions."
          );
        }

        // set data from row 0
        returnData = resultData[0];
      }

      const hookInfo: IHookInfo<any, TSource> = {
        returnData,
        returnQuery: returnQueryBuild,
        entityId,
        type: mutationBuild.mutation.type,
        obj,
        args,
        context,
        info,
        isAuthenticated,
        match,
        resolverMeta,
        dbMeta,
        mutationQuery: mutationBuild
      };

      // TODO: Move this in front of mutation. What hookInfos are needed?
      await hookManager.executePreMutationCommitHooks(queryRunner, hookInfo);

      await queryRunner.commitTransaction();

      await hookManager.executePostMutationHooks(hookInfo, context, info, (overWriteReturnData) => {
        returnData = overWriteReturnData;
      });

      return returnData;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  };
}
