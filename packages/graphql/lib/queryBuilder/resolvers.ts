import { parseResolveInfo } from 'graphql-parse-resolve-info';
import { getQueryResolver } from './sqlGenerator/read';
import { getMutationResolver } from './sqlGenerator/mutate';
import { checkQueryResult } from './injectionProtector';
import * as gQlTypeJson from 'graphql-type-json';

export function getResolvers(gQlTypes, dbObject, queries: any, mutations, customOperations, resolversObject, hooks, dbGeneralPool, logger) {
  // Initialize stuff / get instances / etc.
  const queryResolver = getQueryResolver(gQlTypes, dbObject);
  const mutationResolver = getMutationResolver(gQlTypes, dbObject, mutations);

  const queryResolvers = {};
  const mutationResolvers = {};

  // Generate querie resolvers
  Object.values(queries).forEach((query: any) => {
    // Add async resolver function to queryResolvers
    queryResolvers[query.name] = async (obj, args, context, info) => {

        let isAuthenticated = false;
        if (context.accessToken != null) {
          isAuthenticated = true;
        }
        // Generate select sql query
        const selectQuery = queryResolver(obj, args, context, info, isAuthenticated);

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

          // Run query against pg to get data
          const result = await client.query(selectQuery.sql, selectQuery.values);
          checkQueryResult(selectQuery.query.name, result, logger);
          await client.query('ROLLBACK');

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
    };
  });

  // Generate mutation resolvers
  Object.values(mutations).forEach((mutation: any) => {
    // Add async resolver function to mutationResolvers
    mutationResolvers[mutation.name] = async (obj, args, context, info) => {

        let isAuthenticated = false;
        if (context.accessToken != null) {
          isAuthenticated = true;
        }
        // Generate mutation sql query
        const mutationQuery = mutationResolver(obj, args, context, info);
        context.ctx.state.includesMutation = true;

        // Get a pgClient from pool
        const client = await dbGeneralPool.pgPool.connect();

        try {
          // Begin transaction
          await client.query('BEGIN');
          // Set current user for permissions
          /*if (context.accessToken != null) {
            await auth.setUser(client, context.accessToken);
          }*/

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
          if (mutationQuery.mutation.returnType === 'ID') {
            returnData = entityId;
          } else {
            // Create a match to search for the new created or updated entity
            match = {
              type: 'SIMPLE',
              foreignFieldName: 'id',
              fieldExpression: `'${entityId}'::uuid`
            };

            // Generate sql query for response-data of the mutation
            returnQuery = queryResolver(obj, args, context, info, isAuthenticated, match);

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
            gQlTypes,
            dbObject,
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
    };
  });

  // Add custom queries to queryResolvers
  Object.values(customOperations.queries).forEach((operation: any) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The custom resolver "${operation.resolver}" is not defined. You used it in custom Query "${operation.name}".`);
    }

    queryResolvers[operation.name] = (obj, args, context, info) => {
      return resolversObject[operation.resolver](obj, args, context, info, operation.params);
    };
  });

  // Add custom mutations to mutationResolvers
  Object.values(customOperations.mutations).forEach((operation: any) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The custom resolver "${operation.resolver}" is not defined. You used it in custom Mutation "${operation.name}".`);
    }

    mutationResolvers[operation.name] = (obj, args, context, info) => {
      return resolversObject[operation.resolver](obj, args, context, info, operation.params);
    };
  });

  const resolvers = {
    // Add JSON Scalar
    JSON: gQlTypeJson,
    Query: queryResolvers,
    Mutation: mutationResolvers
  };

  // Add custom field resolvers to resolvers object
  Object.values(customOperations.fields).forEach((operation: any) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The custom resolver "${operation.resolver}" is not defined.` +
      ` You used it in custom Field "${operation.fieldName}" in Type "${operation.viewName}".`);
    }

    if (resolvers[operation.gqlTypeName] == null) {
      resolvers[operation.gqlTypeName] = {};
    }

    resolvers[operation.gqlTypeName][operation.fieldName] = (obj, args, context, info) => {
      return resolversObject[operation.resolver](obj, args, context, info, operation.params);
    };
  });

  return resolvers;
}
