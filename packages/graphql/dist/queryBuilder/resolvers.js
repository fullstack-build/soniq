"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const read_1 = require("./sqlGenerator/read");
const mutate_1 = require("./sqlGenerator/mutate");
const gQlTypeJson = require("graphql-type-json");
function getResolvers(gQlTypes, dbObject, queries, mutations, customOperations, resolversObject, preQueryHooks, dbGeneralPool) {
    // Initialize stuff / get instances / etc.
    const queryResolver = read_1.getQueryResolver(gQlTypes, dbObject);
    const mutationResolver = mutate_1.getMutationResolver(gQlTypes, dbObject, mutations);
    const queryResolvers = {};
    const mutationResolvers = {};
    // Generate querie resolvers
    Object.values(queries).forEach((query) => {
        // Add async resolver function to queryResolvers
        queryResolvers[query.name] = (obj, args, context, info) => __awaiter(this, void 0, void 0, function* () {
            let isAuthenticated = false;
            if (context.accessToken != null) {
                isAuthenticated = true;
            }
            // Generate select sql query
            const selectQuery = queryResolver(obj, args, context, info, isAuthenticated);
            // Get a pgClient from pool
            const client = yield dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                // Set current user for permissions
                /*if (context.accessToken != null && selectQuery.authRequired) {
                  context.ctx.state.authRequired = true;
                  await auth.setUser(client, context.accessToken);
                }*/
                // Set authRequired in koa state for cache headers
                // console.log(context.accessToken);
                if (context.accessToken != null && selectQuery.authRequired) {
                    context.ctx.state.authRequired = true;
                }
                // PreQueryHook (for auth)
                for (const fn of preQueryHooks) {
                    yield fn(client, context, selectQuery.authRequired);
                }
                // tslint:disable-next-line:no-console
                console.log('RUN QUERY', selectQuery.sql, selectQuery.values);
                // Run query against pg to get data
                const { rows } = yield client.query(selectQuery.sql, selectQuery.values);
                // tslint:disable-next-line:no-console
                console.log('rows', rows);
                // Read JSON data from first row
                const data = rows[0][selectQuery.query.name];
                // Commit transaction
                yield client.query('COMMIT');
                // Respond data it to pgClient
                return data;
            }
            catch (e) {
                // Rollback on any error
                yield client.query('ROLLBACK');
                throw e;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    });
    // Generate mutation resolvers
    Object.values(mutations).forEach((mutation) => {
        // Add async resolver function to mutationResolvers
        mutationResolvers[mutation.name] = (obj, args, context, info) => __awaiter(this, void 0, void 0, function* () {
            let isAuthenticated = false;
            if (context.accessToken != null) {
                isAuthenticated = true;
            }
            // Generate mutation sql query
            const mutationQuery = mutationResolver(obj, args, context, info);
            context.ctx.state.includesMutation = true;
            // Get a pgClient from pool
            const client = yield dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                // Set current user for permissions
                /*if (context.accessToken != null) {
                  await auth.setUser(client, context.accessToken);
                }*/
                // PreQueryHook (for auth)
                for (const fn of preQueryHooks) {
                    yield fn(client, context, context.accessToken != null);
                }
                // tslint:disable-next-line:no-console
                console.log('RUN MUTATION', mutationQuery.sql, mutationQuery.values);
                // Run SQL mutation (INSERT/UPDATE/DELETE) against pg
                const { rows } = yield client.query(mutationQuery.sql, mutationQuery.values);
                if (rows.length < 1) {
                    throw new Error('No rows affected by this mutation. Either the entity does not exist or you are not permitted.');
                }
                let returnData;
                // When mutationType is DELETE just return the id. Otherwise query for the new data.
                if (mutationQuery.mutation.type === 'DELETE') {
                    returnData = rows[0].id;
                }
                else {
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
                    const { rows: returnRows } = yield client.query(returnQuery.sql, returnQuery.values);
                    // set data from row 0
                    returnData = returnRows[0][returnQuery.query.name][0];
                }
                // Commit transaction
                yield client.query('COMMIT');
                // Respond data it to pgClient
                return returnData;
            }
            catch (e) {
                // Rollback on any error
                yield client.query('ROLLBACK');
                throw e;
            }
            finally {
                // Release pgClient to pool
                client.release();
            }
        });
    });
    // Add custom queries to queryResolvers
    Object.values(customOperations.queries).forEach((operation) => {
        if (resolversObject[operation.resolver] == null) {
            throw new Error(`The custom resolver "${operation.resolver}" is not defined. You used it in custom Query "${operation.name}".`);
        }
        queryResolvers[operation.name] = (obj, args, context, info) => {
            return resolversObject[operation.resolver](obj, args, context, info, operation.params);
        };
    });
    // Add custom mutations to mutationResolvers
    Object.values(customOperations.mutations).forEach((operation) => {
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
    Object.values(customOperations.fields).forEach((operation) => {
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
exports.getResolvers = getResolvers;
