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
const apollo_server_koa_1 = require("apollo-server-koa");
const graphql_tools_1 = require("graphql-tools");
const koaBody = require("koa-bodyparser");
const KoaRouter = require("koa-router");
const resolvers_1 = require("./queryBuilder/resolvers");
// fullstack-one core
const di_1 = require("@fullstack-one/di");
// DI imports
const logger_1 = require("@fullstack-one/logger");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const graphql_parser_1 = require("@fullstack-one/graphql-parser");
const helper_1 = require("@fullstack-one/helper");
const server_1 = require("@fullstack-one/server");
const db_1 = require("@fullstack-one/db");
let GraphQl = class GraphQl {
    constructor(loggerFactory, config, bootLoader, gqlParser, server, dbGeneralPool) {
        this.resolvers = {};
        this.customQueries = [];
        this.customMutations = [];
        this.customFields = {};
        this.preQueryHooks = [];
        // register package config
        config.addConfigFolder(__dirname + '/../config');
        this.dbGeneralPool = dbGeneralPool;
        this.server = server;
        this.gqlParser = gqlParser;
        this.logger = loggerFactory.create('GraphQl');
        this.graphQlConfig = config.getConfig('graphql');
        this.ENVIRONMENT = config.ENVIRONMENT;
        // add boot function to boot loader
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    addPreQueryHook(fn) {
        this.preQueryHooks.push(fn);
    }
    addResolvers(resolversObject) {
        this.resolvers = Object.assign(this.resolvers, resolversObject);
    }
    addCustomQuery(operation) {
        this.customQueries.push(operation);
    }
    addCustomMutation(operation) {
        this.customMutations.push(operation);
    }
    addCustomFields(operations) {
        this.customFields = Object.assign(this.customFields, operations);
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            const gqlKoaRouter = new KoaRouter();
            // Load resolvers
            const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
            this.addResolvers(yield helper_1.helper.requireFilesByGlobPatternAsObject(resolversPattern));
            const gQlRuntimeObject = this.gqlParser.getGQlRuntimeObject();
            let customOperations = {};
            if (gQlRuntimeObject.customOperations == null) {
                this.logger.warn('boot.no.resolver.files.found');
                gQlRuntimeObject.customOperations = {};
                return;
            }
            else {
                customOperations = JSON.parse(JSON.stringify(gQlRuntimeObject.customOperations));
                customOperations.queries = customOperations.queries.concat(this.customQueries.slice());
                customOperations.mutations = customOperations.mutations.concat(this.customMutations.slice());
                customOperations.fields = Object.assign(customOperations.fields, this.customFields);
            }
            const schema = graphql_tools_1.makeExecutableSchema({
                typeDefs: gQlRuntimeObject.gQlRuntimeSchema,
                resolvers: resolvers_1.getResolvers(gQlRuntimeObject.gQlTypes, gQlRuntimeObject.dbMeta, gQlRuntimeObject.queries, gQlRuntimeObject.mutations, customOperations, this.resolvers, this.preQueryHooks, this.dbGeneralPool),
            });
            const setCacheHeaders = (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                yield next();
                let cacheHeader = 'no-store';
                // console.log(ctx.response.body, ctx.response.body != null , typeof ctx.response.body);
                // || (ctx.body != null && ctx.body.errors != null && ctx.body.errors.length > 0)
                if (ctx.state.includesMutation === true) {
                    cacheHeader = 'no-store';
                }
                else {
                    if (ctx.state.authRequired === true) {
                        cacheHeader = 'privat, max-age=600';
                    }
                    else {
                        cacheHeader = 'public, max-age=600';
                    }
                }
                ctx.set('Cache-Control', cacheHeader);
            });
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
            gqlKoaRouter.post(this.graphQlConfig.endpoint, koaBody(), setCacheHeaders, apollo_server_koa_1.graphqlKoa(gQlParam));
            gqlKoaRouter.get(this.graphQlConfig.endpoint, setCacheHeaders, apollo_server_koa_1.graphqlKoa(gQlParam));
            // graphiql
            if (this.graphQlConfig.graphiQlEndpointActive) {
                gqlKoaRouter.get(this.graphQlConfig.graphiQlEndpoint, apollo_server_koa_1.graphiqlKoa({ endpointURL: this.graphQlConfig.endpoint }));
            }
            const app = this.server.getApp();
            app.use(gqlKoaRouter.routes());
            app.use(gqlKoaRouter.allowedMethods());
        });
    }
};
GraphQl = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(1, di_1.Inject(type => config_1.Config)),
    __param(2, di_1.Inject(type => boot_loader_1.BootLoader)),
    __param(3, di_1.Inject(type => graphql_parser_1.GraphQlParser)),
    __param(4, di_1.Inject(type => server_1.Server)),
    __param(5, di_1.Inject(type => db_1.DbGeneralPool)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], GraphQl);
exports.GraphQl = GraphQl;
