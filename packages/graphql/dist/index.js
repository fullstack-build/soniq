"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const apolloServer = require("apollo-server-koa");
exports.apolloServer = apolloServer;
const { graphiqlKoa, graphqlKoa } = apolloServer;
const graphql_tools_1 = require("graphql-tools");
const koaBody = require("koa-bodyparser");
const KoaRouter = require("koa-router");
const apollo_client_1 = require("apollo-client");
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const apollo_link_schema_1 = require("apollo-link-schema");
const resolvers_1 = require("./resolvers");
const resolvers_2 = require("./queryBuilder/resolvers");
const compareOperators_1 = require("./compareOperators");
const getOperations_1 = require("./getOperations");
const getOperatorsDefinition_1 = require("./getOperatorsDefinition");
// fullstack-one core
const di_1 = require("@fullstack-one/di");
// DI imports
const logger_1 = require("@fullstack-one/logger");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const schema_builder_1 = require("@fullstack-one/schema-builder");
const helper_1 = require("@fullstack-one/helper");
const server_1 = require("@fullstack-one/server");
const db_1 = require("@fullstack-one/db");
let GraphQl = class GraphQl {
    constructor(loggerFactory, config, bootLoader, schemaBuilder, server, dbGeneralPool) {
        this.resolvers = {};
        this.operations = {};
        this.hooks = {
            preQuery: [],
            // postQuery: No use case, since everything can be achieved with custom fields or permissions
            // preMutation = preQuery (Mutation is a Query in GraphQL)
            postMutation: [],
            preMutationCommit: []
        };
        // register package config
        this.graphQlConfig = config.registerConfig("GraphQl", `${__dirname}/../config`);
        this.loggerFactory = loggerFactory;
        this.config = config;
        this.dbGeneralPool = dbGeneralPool;
        this.server = server;
        this.schemaBuilder = schemaBuilder;
        let extendSchema = "";
        this.logger = this.loggerFactory.create(this.constructor.name);
        this.ENVIRONMENT = this.config.ENVIRONMENT;
        Object.values(compareOperators_1.operatorsObject).forEach((operator) => {
            if (operator.extendSchema != null) {
                extendSchema += `${operator.extendSchema}\n`;
            }
        });
        if (extendSchema !== "") {
            this.schemaBuilder.extendSchema(extendSchema);
        }
        // add boot function to boot loader
        bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            const gqlKoaRouter = new KoaRouter();
            // Load resolvers
            const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
            this.addResolvers(yield helper_1.AHelper.requireFilesByGlobPatternAsObject(resolversPattern));
            const { gqlRuntimeDocument, dbMeta, resolverMeta } = this.schemaBuilder.getGQlRuntimeObject();
            const runtimeSchema = this.prepareSchema(gqlRuntimeDocument, dbMeta, resolverMeta);
            const schema = graphql_tools_1.makeExecutableSchema({
                typeDefs: runtimeSchema,
                resolvers: resolvers_1.getResolvers(this.operations, this.resolvers, this.hooks, this.dbGeneralPool, this.logger)
            });
            this.apolloSchema = schema;
            this.apolloClient = new apollo_client_1.ApolloClient({
                ssrMode: true,
                cache: new apollo_cache_inmemory_1.InMemoryCache(),
                link: new apollo_link_schema_1.SchemaLink({
                    schema: this.apolloSchema,
                    context: {
                        ctx: {},
                        accessToken: null
                    }
                })
            });
            const setCacheHeaders = (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                yield next();
                let cacheHeader = "no-store";
                // console.log(ctx.response.body, ctx.response.body != null , typeof ctx.response.body);
                // || (ctx.body != null && ctx.body.errors != null && ctx.body.errors.length > 0)
                if (ctx.state.includesMutation === true) {
                    cacheHeader = "no-store";
                }
                else {
                    if (ctx.state.authRequired === true) {
                        cacheHeader = "privat, max-age=600"; // TODO: To config
                    }
                    else {
                        cacheHeader = "public, max-age=600";
                    }
                }
                ctx.set("Cache-Control", cacheHeader);
            });
            const enforceOriginMatch = (ctx, next) => {
                const errorMessage = "All graphql endpoints only allow requests with origin and referrer headers or API-Client requests from non-browsers.";
                // If securityContext is missing, don't allow the request.
                if (ctx.securityContext == null) {
                    return ctx.throw(400, errorMessage);
                }
                // If a user is requesting data through an API-Client (not a Browser) simply allow everything
                if (ctx.securityContext.isApiClient === true) {
                    return next();
                }
                // If the request is approved by origin and referrer it is allowed
                if (ctx.securityContext.sameOriginApproved.byOrigin === true && ctx.securityContext.sameOriginApproved.byReferrer === true) {
                    return next();
                }
                // Else forbid everything
                return ctx.throw(400, errorMessage);
            };
            const gQlParam = (ctx) => {
                ctx.state.authRequired = false;
                ctx.state.includesMutation = false;
                return {
                    schema,
                    context: {
                        ctx,
                        accessToken: ctx.state.accessToken
                    }
                };
            };
            // koaBody is needed just for POST.
            gqlKoaRouter.post(this.graphQlConfig.endpoint, koaBody(), enforceOriginMatch, setCacheHeaders, graphqlKoa(gQlParam));
            gqlKoaRouter.get(this.graphQlConfig.endpoint, enforceOriginMatch, setCacheHeaders, graphqlKoa(gQlParam));
            // graphiql
            if (this.graphQlConfig.graphiQlEndpointActive) {
                // TODO: === true
                gqlKoaRouter.get(this.graphQlConfig.graphiQlEndpoint, graphiqlKoa({ endpointURL: this.graphQlConfig.endpoint }));
            }
            const app = this.server.getApp();
            app.use(gqlKoaRouter.routes());
            app.use(gqlKoaRouter.allowedMethods());
        });
    }
    addPreQueryHook(fn) {
        // TODO: Remove
        this.logger.warn("Function 'addPreQueryHook' is deprecated. Please use 'addHook(name, fn)'.");
        this.hooks.preQuery.push(fn);
    }
    addHook(name, fn) {
        if (this.hooks[name] == null || Array.isArray(this.hooks[name]) !== true) {
            throw new Error(`The hook '${name}' does not exist.`);
        }
        this.hooks[name].push(fn);
    }
    addResolvers(resolversObject) {
        this.resolvers = Object.assign({}, this.resolvers, resolversObject);
    }
    prepareSchema(gqlRuntimeDocument, dbMeta, resolverMeta) {
        gqlRuntimeDocument.definitions.push(getOperatorsDefinition_1.getOperatorsDefinition(compareOperators_1.operatorsObject));
        this.addResolvers(resolvers_2.getDefaultResolvers(resolverMeta, this.hooks, dbMeta, this.dbGeneralPool, this.logger, this.graphQlConfig.queryCostLimit, this.graphQlConfig.minQueryDepthToCheckCostLimit));
        this.operations = getOperations_1.getOperations(gqlRuntimeDocument);
        return this.schemaBuilder.print(gqlRuntimeDocument);
    }
    getApolloClient(accessToken = null, ctx = {}) {
        if (this.apolloSchema == null) {
            throw new Error("Please call getApolloClient after booting has completed.");
        }
        if (accessToken != null) {
            return new apollo_client_1.ApolloClient({
                ssrMode: true,
                cache: new apollo_cache_inmemory_1.InMemoryCache(),
                link: new apollo_link_schema_1.SchemaLink({
                    schema: this.apolloSchema,
                    context: {
                        ctx,
                        accessToken
                    }
                })
            });
        }
        // return generic (not authorized) apollo client
        // reset cache before returning. Apollo Cache is not able to invalidate correct.
        this.apolloClient.cache.reset();
        return this.apolloClient;
    }
};
GraphQl = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => logger_1.LoggerFactory)),
    __param(1, di_1.Inject((type) => config_1.Config)),
    __param(2, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __param(3, di_1.Inject((type) => schema_builder_1.SchemaBuilder)),
    __param(4, di_1.Inject((type) => server_1.Server)),
    __param(5, di_1.Inject((type) => db_1.DbGeneralPool)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], GraphQl);
exports.GraphQl = GraphQl;
