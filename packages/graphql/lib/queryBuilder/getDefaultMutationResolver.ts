import { IFieldResolver } from "graphql-tools";

import { DbGeneralPool } from "@fullstack-one/db";
import { ILogger } from "@fullstack-one/logger";
import { IDbMeta } from "@fullstack-one/schema-builder";

import { IHookObject } from "./types";
import checkCosts from "./checkCosts";
import checkQueryResultForInjection from "./checkQueryResultForInjection";
import MutationBuilder from "./sqlGenerator/MutationBuilder";
import QueryBuilder from "./sqlGenerator/QueryBuilder";

export default function getDefaultMutationResolver(
  dbGeneralPool: DbGeneralPool,
  logger: ILogger,
  queryBuilder: QueryBuilder,
  mutationBuilder: MutationBuilder,
  hookObject: IHookObject,
  costLimit: number,
  resolverMeta: any,
  dbMeta: IDbMeta
): IFieldResolver<any, any> {
  return async (obj, args, context, info) => {
    const isAuthenticated = context.accessToken != null;

    // Generate mutation sql query
    const mutationQuery = mutationBuilder.build(info);
    context.ctx.state.includesMutation = true;

    // Get a pgClient from pool
    const client = await dbGeneralPool.pgPool.connect();

    try {
      await client.query("BEGIN");

      // PreQueryHook (for auth)
      for (const fn of hookObject.preQuery) {
        await fn(client, context, context.accessToken != null);
      }

      logger.trace("mutationResolver.run", mutationQuery.sql, mutationQuery.values);

      // Run SQL mutation (INSERT/UPDATE/DELETE) against pg
      const result = await client.query(mutationQuery.sql, mutationQuery.values);

      if (result.rowCount < 1) {
        throw new Error("No rows affected by this mutation. Either the entity does not exist or you are not permitted.");
      }

      let returnQuery;
      let returnData;
      let entityId = mutationQuery.id || null;
      let match;

      // Workaround: Postgres does not return id for INSERT without SELECT  permission.
      // Therefor we retrieve the last generated UUID in transaction.
      // Our concept allows one one INSERT per transaction.
      if (entityId == null && mutationQuery.mutation.type === "CREATE") {
        const idResult = await client.query('SELECT "_meta"."get_last_generated_uuid"() AS "id";');
        entityId = idResult.rows[0].id;
      }

      // Check if this mutations returnType is ID
      // e.g. When mutationType is DELETE just return the id. Otherwise query for the new data.
      // e.g. When this is a user-creation the creator has no access to his own user before login.
      if (mutationQuery.mutation.gqlReturnTypeName === "ID") {
        returnData = entityId;
      } else {
        // Create a match to search for the new created or updated entity
        match = {
          type: "SIMPLE",
          foreignFieldName: "id",
          fieldExpression: `'${entityId}'::uuid`
        };

        // Generate sql query for response-data of the mutation
        returnQuery = queryBuilder.build(info, isAuthenticated, match);

        logger.trace("mutationResolver.returnQuery.run", returnQuery.sql, returnQuery.values);

        if (returnQuery.potentialHighCost === true) {
          const currentCost = await checkCosts(client, returnQuery, costLimit);
          logger.warn(
            "The current query has been identified as potentially too expensive and could get denied in case the" +
              ` data set gets bigger. Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${returnQuery.maxDepth})`
          );
        }

        // Run SQL query on pg to get response-data
        const returnResult = await client.query(returnQuery.sql, returnQuery.values);
        checkQueryResultForInjection(returnResult, logger);

        const { rows: returnRows } = returnResult;

        const resultData = returnRows[0][returnQuery.query.name];

        if (resultData.length < 1) {
          throw new Error(
            "The return-query of this mutation has no entries. Perhaps you are not permitted to access the results." +
              " You can set 'returnOnlyId' on the permission-view to be able to run this mutation without changing read-permissions."
          );
        }

        // set data from row 0
        returnData = resultData[0];
      }

      const hookInfo = {
        returnData,
        returnQuery,
        entityId,
        type: mutationQuery.mutation.type,
        obj,
        args,
        context,
        info,
        isAuthenticated,
        match,
        resolverMeta,
        dbMeta,
        mutationQuery
      };

      // PreMutationCommitHook (for auth register etc.)
      // TODO: Move this in front of mutation
      for (const fn of hookObject.preMutationCommit) {
        await fn(client, hookInfo);
      }

      // Commit transaction
      await client.query("COMMIT");

      // PostMutationHook (for file-storage etc.)
      for (const fn of hookObject.postMutation) {
        await fn(hookInfo, context, info);
      }

      // Respond data it to pgClient
      return returnData;
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
