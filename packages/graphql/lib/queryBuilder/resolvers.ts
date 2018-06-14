import { parseResolveInfo } from 'graphql-parse-resolve-info';
import { QueryBuilder } from './sqlGenerator/read';
import { MutationBuilder } from './sqlGenerator/mutate';
import { checkQueryResult } from './injectionProtector';

async function checkCosts(client, query, costLimit) {
  const result = await client.query(`EXPLAIN ${query.sql}`, query.values);

  const queryPlan = result.rows[0]['QUERY PLAN'];

  const data: any = {};

  queryPlan.split('(')[1].split(')')[0].split(' ').forEach((element) => {
    const keyValue = element.split('=');
    data[keyValue[0]] = keyValue[1];
  });

  const costs = data.cost.split('.').filter(i => i !== '').map(i => parseInt(i, 10));

  let currentCost = 0;

  costs.forEach((cost) => {
    currentCost = cost > currentCost ? cost : currentCost;
    if (cost > costLimit) {
      throw new Error(`This query seems to be to exprensive. Please set some limits. ` +
      `Costs: (current: ${currentCost}, limit: ${costLimit}, calculated: ${query.cost})`);
    }
  });

  return currentCost;
}

export function getDefaultResolvers(resolverMeta, hooks, dbMeta, dbGeneralPool, logger, costLimit) {
  const queryBuilder = new QueryBuilder(resolverMeta, dbMeta, costLimit);
  const mutationBuilder = new MutationBuilder(resolverMeta);

  return {
    '@fullstack-one/graphql/queryResolver': async (obj, args, context, info) => {
      let isAuthenticated = false;
      if (context.accessToken != null) {
        isAuthenticated = true;
      }
      // Generate select sql query
      const selectQuery = queryBuilder.build(obj, args, context, info, isAuthenticated);

      // Get a pgClient from pool
      const client = await dbGeneralPool.pgPool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Set authRequired in koa state for cache headers
        if (context.accessToken != null && selectQuery.authRequired) {
          context.ctx.state.authRequired = true;
        }

        // PreQueryHook (for auth)
        for (const fn of hooks.preQuery) {
          await fn(client, context, selectQuery.authRequired);
        }

        logger.trace('queryResolver.run', selectQuery.sql, selectQuery.values);

        if (selectQuery.potentialHighCost === true) {
          const currentCost = await checkCosts(client, selectQuery, costLimit);
          logger.warn(`The current query has been identified as potential to expensive. It could be denied in future` +
          ` when your data gets bigger. Costs: (current: ${currentCost}, limit: ${costLimit}, calculated: ${selectQuery.cost})`);
        }

        // Run query against pg to get data
        const result = await client.query(selectQuery.sql, selectQuery.values);
        checkQueryResult(selectQuery.query.name, result, logger);

        const { rows } = result;
        // Read JSON data from first row
        const data = rows[0][selectQuery.query.name];

        // Commit transaction
        await client.query('COMMIT');

        // Respond data it to pgClient
        return data;

      } catch (e) {
        // Rollback on any error
        await client.query('ROLLBACK');
        throw e;
      } finally {
        // Release pgClient to pool
        client.release();
      }
    },
    '@fullstack-one/graphql/mutationResolver': async (obj, args, context, info) => {

        let isAuthenticated = false;
        if (context.accessToken != null) {
          isAuthenticated = true;
        }
        // Generate mutation sql query
        const mutationQuery = mutationBuilder.build(obj, args, context, info);
        context.ctx.state.includesMutation = true;

        // Get a pgClient from pool
        const client = await dbGeneralPool.pgPool.connect();

        try {
          // Begin transaction
          await client.query('BEGIN');

          // PreQueryHook (for auth)
          for (const fn of hooks.preQuery) {
            await fn(client, context, context.accessToken != null);
          }

          logger.trace('mutationResolver.run', mutationQuery.sql, mutationQuery.values);

          // Run SQL mutation (INSERT/UPDATE/DELETE) against pg
          const result = await client.query(mutationQuery.sql, mutationQuery.values);
          const { rows } = result;

          if (result.rowCount < 1) {
            throw new Error('No rows affected by this mutation. Either the entity does not exist or you are not permitted.');
          }

          let returnQuery;
          let returnData;
          let entityId = mutationQuery.id || null;
          let match;

          if (entityId == null && mutationQuery.mutation.type === 'CREATE') {
            const idResult = await client.query(`SELECT "_meta"."get_last_generated_uuid"() AS "id";`);
            entityId = idResult.rows[0].id;
          }

          // Check if this mutations returnType is ID
          // e.g. When mutationType is DELETE just return the id. Otherwise query for the new data.
          // e.g. When this is a user-creation the creator has no access to his own user before login.
          if (mutationQuery.mutation.gqlReturnTypeName === 'ID') {
            returnData = entityId;
          } else {
            // Create a match to search for the new created or updated entity
            match = {
              type: 'SIMPLE',
              foreignFieldName: 'id',
              fieldExpression: `'${entityId}'::uuid`
            };

            // Generate sql query for response-data of the mutation
            returnQuery = queryBuilder.build(obj, args, context, info, isAuthenticated, match);

            logger.trace('mutationResolver.returnQuery.run', returnQuery.sql, returnQuery.values);

            // Run SQL query on pg to get response-data
            const returnResult = await client.query(returnQuery.sql, returnQuery.values);
            checkQueryResult(returnQuery.query.name, returnResult, logger);

            const { rows: returnRows } = returnResult;

            // set data from row 0
            returnData = returnRows[0][returnQuery.query.name][0];
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
          for (const fn of hooks.preMutationCommit) {
            await fn(client, hookInfo);
          }

          // Commit transaction
          await client.query('COMMIT');

          // PostMutationHook (for file-storage etc.)
          for (const fn of hooks.postMutation) {
            await fn(hookInfo, context, info);
          }

          // Respond data it to pgClient
          return returnData;

        } catch (e) {
          // Rollback on any error
          await client.query('ROLLBACK');
          throw e;
        } finally {
          // Release pgClient to pool
          client.release();
        }
    }
  };
}
