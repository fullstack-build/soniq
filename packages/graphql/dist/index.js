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
// fullstack-one core
const ONE = require("fullstack-one");
// import sub modules
const helper_1 = require("./helper");
const parser_1 = require("./parser");
const resolvers_1 = require("./queryBuilder/resolvers");
const graphQlSchemaToDbMeta_1 = require("./graphQlSchemaToDbMeta");
// DI imports
const logger_1 = require("@fullstack-one/logger");
let GraphQl = class GraphQl extends ONE.AbstractPackage {
    constructor(loggerFactory) {
        super();
        this.logger = loggerFactory.create('GraphQl');
        this.graphQlConfig = this.getConfig('graphql');
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // load schema
                const sdlSchemaPattern = this.ENVIRONMENT.path + this.graphQlConfig.schemaPattern;
                this.sdlSchema = yield ONE.helper.loadFilesByGlobPattern(sdlSchemaPattern);
                const sdlSchemaCombined = this.sdlSchema.join('\n');
                this.astSchema = helper_1.graphQl.helper.parseGraphQlSchema(sdlSchemaCombined);
                this.dbMeta = graphQlSchemaToDbMeta_1.parseGraphQlJsonSchemaToDbMeta(this.astSchema);
                // load permissions and expressions and generate views and put them into schemas
                try {
                    // load permissions
                    const viewsPattern = this.ENVIRONMENT.path + this.graphQlConfig.viewsPattern;
                    const viewsArray = yield ONE.helper.requireFilesByGlobPattern(viewsPattern);
                    this.views = [].concat.apply([], viewsArray);
                    // load expressions
                    const expressionsPattern = this.ENVIRONMENT.path + this.graphQlConfig.expressionsPattern;
                    const expressionsArray = yield ONE.helper.requireFilesByGlobPattern(expressionsPattern);
                    this.expressions = [].concat.apply([], expressionsArray);
                    const combinedSchemaInformation = parser_1.runtimeParser(this.astSchema, this.views, this.expressions, this.dbMeta);
                    this.gQlRuntimeDocument = combinedSchemaInformation.document;
                    this.gQlRuntimeSchema = helper_1.graphQl.helper.printGraphQlDocument(this.gQlRuntimeDocument);
                    this.gQlTypes = combinedSchemaInformation.gQlTypes;
                    this.queries = combinedSchemaInformation.queries;
                    this.mutations = combinedSchemaInformation.mutations;
                    this.customOperations = {
                        fields: combinedSchemaInformation.customFields,
                        queries: combinedSchemaInformation.customQueries,
                        mutations: combinedSchemaInformation.customMutations
                    };
                    Object.values(combinedSchemaInformation.dbViews).forEach((dbView) => {
                        if (this.dbMeta.schemas[dbView.viewSchemaName] == null) {
                            this.dbMeta.schemas[dbView.viewSchemaName] = {
                                tables: {},
                                views: {}
                            };
                        }
                        this.dbMeta.schemas[dbView.viewSchemaName].views[dbView.viewName] = dbView;
                    });
                }
                catch (err) {
                    throw err;
                }
                return this.dbMeta;
            }
            catch (err) {
                this.logger.warn('boot.error', err);
            }
        });
    }
    getGraphQlSchema() {
        // return copy insted of ref
        return Object.assign({}, this.sdlSchema);
    }
    getGraphQlJsonSchema() {
        // return copy insted of ref
        return Object.assign({}, this.astSchema);
    }
    addEndpoints() {
        return __awaiter(this, void 0, void 0, function* () {
            const gqlRouter = new KoaRouter();
            // Load resolvers
            const resolversPattern = this.ENVIRONMENT.path + this.graphQlConfig.resolversPattern;
            const resolversObject = yield ONE.helper.requireFilesByGlobPatternAsObject(resolversPattern);
            const schema = graphql_tools_1.makeExecutableSchema({
                typeDefs: this.gQlRuntimeSchema,
                resolvers: resolvers_1.getResolvers(this.gQlTypes, this.dbMeta, this.queries, this.mutations, this.customOperations, resolversObject),
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
            gqlRouter.post('/graphql', koaBody(), setCacheHeaders, apollo_server_koa_1.graphqlKoa(gQlParam));
            gqlRouter.get('/graphql', setCacheHeaders, apollo_server_koa_1.graphqlKoa(gQlParam));
            gqlRouter.get(this.graphQlConfig.graphiQlEndpoint, apollo_server_koa_1.graphiqlKoa({ endpointURL: this.graphQlConfig.endpoint }));
            this.$one.app.use(gqlRouter.routes());
            this.$one.app.use(gqlRouter.allowedMethods());
        });
    }
};
__decorate([
    ONE.Inject(type => ONE.FullstackOneCore),
    __metadata("design:type", ONE.FullstackOneCore)
], GraphQl.prototype, "$one", void 0);
__decorate([
    ONE.Inject('ENVIRONMENT'),
    __metadata("design:type", Object)
], GraphQl.prototype, "ENVIRONMENT", void 0);
GraphQl = __decorate([
    ONE.Service(),
    __param(0, ONE.Inject(type => logger_1.LoggerFactory)),
    __metadata("design:paramtypes", [Object])
], GraphQl);
exports.GraphQl = GraphQl;
