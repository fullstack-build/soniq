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
const injectionProtector_1 = require("./injectionProtector");
const crypto = require("crypto");
function sha1Base64(input) {
    return crypto.createHash('sha1').update(input).digest('base64');
}
exports.sha1Base64 = sha1Base64;
const costCache = {};
const COST_CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // One Day
function getCurrentCosts(client, query) {
    return __awaiter(this, void 0, void 0, function* () {
        const queryHash = sha1Base64(query.sql + query.values.join(''));
        if (costCache[queryHash] != null) {
            if (costCache[queryHash].t + COST_CACHE_MAX_AGE > Date.now()) {
                return costCache[queryHash].c;
            }
            else {
                costCache[queryHash] = null;
                delete costCache[queryHash];
            }
        }
        const result = yield client.query(`EXPLAIN ${query.sql}`, query.values);
        const queryPlan = result.rows[0]['QUERY PLAN'];
        const data = {};
        queryPlan.split('(')[1].split(')')[0].split(' ').forEach((element) => {
            const keyValue = element.split('=');
            data[keyValue[0]] = keyValue[1];
        });
        const costs = data.cost.split('.').filter(i => i !== '').map(i => parseInt(i, 10));
        let currentCost = 0;
        costs.forEach((cost) => {
            currentCost = cost > currentCost ? cost : currentCost;
        });
        costCache[queryHash] = {
            c: currentCost,
            t: Date.now()
        };
        // Clean up cache
        Object.keys(costCache).forEach((key) => {
            const now = Date.now();
            if (costCache[key].time + COST_CACHE_MAX_AGE < now) {
                costCache[key] = null;
                delete costCache[key];
            }
        });
        return currentCost;
    });
}
function checkCosts(client, query, costLimit) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentCost = yield getCurrentCosts(client, query);
        if (currentCost > costLimit) {
            throw new Error('This query seems to be to exprensive. Please set some limits. ' +
                `Costs: (current: ${currentCost}, limit: ${costLimit}, calculated: ${query.cost})`);
        }
        return currentCost;
    });
}
function getDefaultResolvers(resolverMeta, hooks, dbMeta, dbGeneralPool, logger, costLimit, minQueryDepthToCheckCostLimit) {
    const queryBuilder = new read_1.QueryBuilder(resolverMeta, dbMeta, costLimit, minQueryDepthToCheckCostLimit);
    const mutationBuilder = new mutate_1.MutationBuilder(resolverMeta);
    return {
        '@fullstack-one/graphql/queryResolver': (obj, args, context, info) => __awaiter(this, void 0, void 0, function* () {
            let isAuthenticated = false;
            if (context.accessToken != null) {
                isAuthenticated = true;
            }
            // Generate select sql query
            const selectQuery = queryBuilder.build(obj, args, context, info, isAuthenticated);
            // Get a pgClient from pool
            const client = yield dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                // Set authRequired in koa state for cache headers
                if (context.accessToken != null && selectQuery.authRequired) {
                    context.ctx.state.authRequired = true;
                }
                // PreQueryHook (for auth)
                for (const fn of hooks.preQuery) {
                    yield fn(client, context, selectQuery.authRequired);
                }
                logger.trace('queryResolver.run', selectQuery.sql, selectQuery.values);
                if (selectQuery.potentialHighCost === true) {
                    const currentCost = yield checkCosts(client, selectQuery, costLimit);
                    logger.warn('The current query has been identified as potentially too expensive and could get denied in case the data set gets bigger.' +
                        ` Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${selectQuery.maxDepth})`);
                }
                // Run query against pg to get data
                const result = yield client.query(selectQuery.sql, selectQuery.values);
                injectionProtector_1.checkQueryResult(selectQuery.query.name, result, logger);
                const { rows } = result;
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
        }),
        '@fullstack-one/graphql/mutationResolver': (obj, args, context, info) => __awaiter(this, void 0, void 0, function* () {
            let isAuthenticated = false;
            if (context.accessToken != null) {
                isAuthenticated = true;
            }
            // Generate mutation sql query
            const mutationQuery = mutationBuilder.build(obj, args, context, info);
            context.ctx.state.includesMutation = true;
            // Get a pgClient from pool
            const client = yield dbGeneralPool.pgPool.connect();
            try {
                // Begin transaction
                yield client.query('BEGIN');
                // PreQueryHook (for auth)
                for (const fn of hooks.preQuery) {
                    yield fn(client, context, context.accessToken != null);
                }
                logger.trace('mutationResolver.run', mutationQuery.sql, mutationQuery.values);
                // Run SQL mutation (INSERT/UPDATE/DELETE) against pg
                const result = yield client.query(mutationQuery.sql, mutationQuery.values);
                const { rows } = result;
                if (result.rowCount < 1) {
                    throw new Error('No rows affected by this mutation. Either the entity does not exist or you are not permitted.');
                }
                let returnQuery;
                let returnData;
                let entityId = mutationQuery.id || null;
                let match;
                if (entityId == null && mutationQuery.mutation.type === 'CREATE') {
                    const idResult = yield client.query('SELECT "_meta"."get_last_generated_uuid"() AS "id";');
                    entityId = idResult.rows[0].id;
                }
                // Check if this mutations returnType is ID
                // e.g. When mutationType is DELETE just return the id. Otherwise query for the new data.
                // e.g. When this is a user-creation the creator has no access to his own user before login.
                if (mutationQuery.mutation.gqlReturnTypeName === 'ID') {
                    returnData = entityId;
                }
                else {
                    // Create a match to search for the new created or updated entity
                    match = {
                        type: 'SIMPLE',
                        foreignFieldName: 'id',
                        fieldExpression: `'${entityId}'::uuid`
                    };
                    // Generate sql query for response-data of the mutation
                    returnQuery = queryBuilder.build(obj, args, context, info, isAuthenticated, match);
                    logger.trace('mutationResolver.returnQuery.run', returnQuery.sql, returnQuery.values);
                    if (returnQuery.potentialHighCost === true) {
                        const currentCost = yield checkCosts(client, returnQuery, costLimit);
                        logger.warn('The current query has been identified as potentially too expensive and could get denied in case the' +
                            ` data set gets bigger. Costs: (current: ${currentCost}, limit: ${costLimit}, maxDepth: ${returnQuery.maxDepth})`);
                    }
                    // Run SQL query on pg to get response-data
                    const returnResult = yield client.query(returnQuery.sql, returnQuery.values);
                    injectionProtector_1.checkQueryResult(returnQuery.query.name, returnResult, logger);
                    const { rows: returnRows } = returnResult;
                    const resultData = returnRows[0][returnQuery.query.name];
                    if (resultData.length < 1) {
                        throw new Error('The return-query of this mutation has no entries. Perhaps you are not permitted to access the results.' +
                            " You can set 'returnOnlyId' on the permission-view to be able to run this mutation without changing read-permissions.");
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
                for (const fn of hooks.preMutationCommit) {
                    yield fn(client, hookInfo);
                }
                // Commit transaction
                yield client.query('COMMIT');
                // PostMutationHook (for file-storage etc.)
                for (const fn of hooks.postMutation) {
                    yield fn(hookInfo, context, info);
                }
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
        })
    };
}
exports.getDefaultResolvers = getDefaultResolvers;
