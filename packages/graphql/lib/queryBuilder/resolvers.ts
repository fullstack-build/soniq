import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';

import {
  getQueryResolver
} from './sqlGenerator/read';

import {
  getMutationResolver
} from './sqlGenerator/mutate';

import * as ONE from 'fullstack-one';
import { Auth } from '@fullstack-one/auth';

/* ======================================================= */

// Note: The normal import isn't working here for some reason. This is why I import via require.

// tslint:disable-next-line:import-name
// import GraphQLJSON from 'graphql-type-json';

// tslint:disable-next-line:no-var-requires
const graphqlTypeJson = require('graphql-type-json');

/* ======================================================= */

export function getResolvers(gQlTypes, dbObject, queries: any, mutations, customOperations, resolversObject) {
  // Initialize stuff / get instances / etc.
  const queryResolver = getQueryResolver(gQlTypes, dbObject);
  const mutationResolver = getMutationResolver(gQlTypes, dbObject, mutations);

  // DI
  // todo needs refactoring @dustin
  const auth: any = ONE.Container.get(Auth);
  const pool: any = ONE.Container.get(ONE.DbGeneralPool);

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
        const client = await pool.connect();

        try {
          // Begin transaction
          await client.query('BEGIN');

          // Set current user for permissions
          if (context.accessToken != null && selectQuery.authRequired) {
            context.ctx.state.authRequired = true;
            await auth.setUser(client, context.accessToken);
          }

          // tslint:disable-next-line:no-console
          console.log('RUN QUERY', selectQuery.sql, selectQuery.values);

          // Run query against pg to get data
          const { rows } = await client.query(selectQuery.sql, selectQuery.values);

          // tslint:disable-next-line:no-console
          console.log('rows', rows);

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
        const client = await pool.connect();

        try {
          // Begin transaction
          await client.query('BEGIN');
          // Set current user for permissions
          if (context.accessToken != null) {
            await auth.setUser(client, context.accessToken);
          }

          // tslint:disable-next-line:no-console
          console.log('RUN MUTATION', mutationQuery.sql, mutationQuery.values);

          // Run SQL mutation (INSERT/UPDATE/DELETE) against pg
          const { rows } = await client.query(mutationQuery.sql, mutationQuery.values);

          if (rows.length < 1) {
            throw new Error('No rows affected by this mutation. Either the entity does not exist or you are not permitted.');
          }

          let returnData;

          // When mutationType is DELETE just return the id. Otherwise query for the new data.
          if (mutationQuery.mutation.type === 'DELETE') {
            returnData = rows[0].id;
          } else {
            let entityId = mutationQuery.id;

            if (mutationQuery.mutation.type === 'CREATE') {
              entityId = rows[0].id;
            }

            // Create a match to search for the new created or updated entity
            const match = {
              type: 'SIMPLE',
              foreignFieldName: 'id',
              fieldExpression: `'${entityId}'::uuid`
            };

            // Generate sql query for response-data of the mutation
            const returnQuery = queryResolver(obj, args, context, info, isAuthenticated, match);

            // tslint:disable-next-line:no-console
            console.log('RUN RETURN QUERY', returnQuery.sql, returnQuery.values);

            // Run SQL query on pg to get response-data
            const { rows: returnRows } = await client.query(returnQuery.sql, returnQuery.values);

            // set data from row 0
            returnData = returnRows[0][returnQuery.query.name][0];
          }

          // Commit transaction
          await client.query('COMMIT');

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
      return resolversObject[operation.resolver](obj, args, context, info, operation.params, ONE);
    };
  });

  // Add custom mutations to mutationResolvers
  Object.values(customOperations.mutations).forEach((operation: any) => {
    if (resolversObject[operation.resolver] == null) {
      throw new Error(`The custom resolver "${operation.resolver}" is not defined. You used it in custom Mutation "${operation.name}".`);
    }

    mutationResolvers[operation.name] = (obj, args, context, info) => {
      return resolversObject[operation.resolver](obj, args, context, info, operation.params, ONE);
    };
  });

  const resolvers = {
    // Add JSON Scalar
    JSON: graphqlTypeJson,
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
      return resolversObject[operation.resolver](obj, args, context, info, operation.params, ONE);
    };
  });

  return resolvers;
}
