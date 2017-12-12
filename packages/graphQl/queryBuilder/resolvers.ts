import {
  parseResolveInfo
} from 'graphql-parse-resolve-info';

import {
  getQueryResolver
} from './sqlGenerator/read';

import {
  getMutationResolver
} from './sqlGenerator/mutate';

import {
  getInstance
} from '../../core';

/* ======================================================= */

// Note: The normal import isn't working here for some reason. This is why I import via require.

// tslint:disable-next-line:import-name
// import GraphQLJSON from 'graphql-type-json';

// tslint:disable-next-line:no-var-requires
const graphqlTypeJson = require('graphql-type-json');

/* ======================================================= */

export function getResolvers(gQlTypes, dbObject, queries, mutations) {
  const queryResolver = getQueryResolver(gQlTypes, dbObject);
  const mutationResolver = getMutationResolver(gQlTypes, dbObject, mutations);

  const one = getInstance();
  const pool = one.getDbPool();

  const queryResolvers = {};
  const mutationResolvers = {};

  Object.values(queries).forEach((query) => {
    queryResolvers[query.name] = async (obj, args, context, info) => {

        const client = await pool.connect();

        const selectQuery = queryResolver(obj, args, context, info);

        try {
          await client.query('BEGIN');

          // Set current user for permissions
          if (context.userId != null) {
            await client.query('set local jwt.claims.user_id to ' + context.userId);
          }

          // tslint:disable-next-line:no-console
          console.log('RUN QUERY', selectQuery.sql, selectQuery.values);

          // Query data
          const { rows } = await client.query(selectQuery.sql, selectQuery.values);

          const data = JSON.parse(rows[0][selectQuery.query.name]);

          await client.query('COMMIT');

          return data;

        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
    };
  });

  Object.values(mutations).forEach((mutation) => {
    mutationResolvers[mutation.name] = async (obj, args, context, info) => {

        const client = await pool.connect();

        const mutationQuery = mutationResolver(obj, args, context, info);

        try {
          await client.query('BEGIN');

          // Set current user for permissions
          if (context.userId != null) {
            await client.query('set local jwt.claims.user_id to ' + context.userId);
          }

          // tslint:disable-next-line:no-console
          console.log('RUN MUTATION', mutationQuery.sql, mutationQuery.values);

          // Query data
          const { rows } = await client.query(mutationQuery.sql, mutationQuery.values);

          let returnData;

          // When mutationType is DELETE just return the id. Otherwise query for the new data.
          if (mutationQuery.mutation.type === 'DELETE') {
            returnData = rows[0].id;
          } else {
            const returnQuery = queryResolver(obj, args, context, info);

            // tslint:disable-next-line:no-console
            console.log('RUN RETURN QUERY', returnQuery.sql, returnQuery.values);

            const { rows: returnRows } = await client.query(returnQuery.sql, returnQuery.values);
            returnData = JSON.parse(returnRows[0][returnQuery.query.name])[0];
          }

          await client.query('COMMIT');

          return returnData;

        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
    };
  });

  const resolvers = {
    JSON: graphqlTypeJson,
    Query: queryResolvers,
    Mutation: mutationResolvers
  };

  return resolvers;
}
