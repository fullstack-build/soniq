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
// import sub modules
const helper_1 = require("./helper");
const parser_1 = require("./parser");
const graphQlSchemaToDbMeta_1 = require("./graphQlSchemaToDbMeta");
// fullstack-one core
const di_1 = require("@fullstack-one/di");
// DI imports
const logger_1 = require("@fullstack-one/logger");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const helper_2 = require("@fullstack-one/helper");
const utils = require("./parser/utils");
exports.utils = utils;
let GraphQlParser = class GraphQlParser {
    constructor(loggerFactory, config, bootLoader) {
        this.sdlSchemaExtensions = [];
        this.parsers = [];
        this.logger = loggerFactory.create('GraphQl');
        this.graphQlConfig = config.getConfig('graphql');
        this.ENVIRONMENT = config.ENVIRONMENT;
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    addParser(parser) {
        this.parsers.push(parser);
    }
    getDbMeta() {
        return this.dbMeta;
    }
    extendSchema(schema) {
        this.sdlSchemaExtensions.push(schema);
    }
    getGqlRuntimeData() {
        return {
            dbMeta: this.dbMeta,
            views: this.views,
            expressions: this.expressions,
            gQlRuntimeDocument: this.gQlRuntimeDocument,
            gQlRuntimeSchema: this.gQlRuntimeSchema,
            gQlTypes: this.gQlTypes,
            mutations: this.mutations,
            queries: this.queries,
            customOperations: this.customOperations
        };
    }
    getGraphQlSchema() {
        // return copy insted of ref
        return Object.assign({}, this.sdlSchema);
    }
    getGraphQlJsonSchema() {
        // return copy insted of ref
        return Object.assign({}, this.astSchema);
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // load schema
                const sdlSchemaPattern = this.ENVIRONMENT.path + this.graphQlConfig.schemaPattern;
                this.sdlSchema = yield helper_2.helper.loadFilesByGlobPattern(sdlSchemaPattern);
                // Combine all Schemas to a big one and add extensions from other modules
                const sdlSchemaCombined = this.sdlSchema.concat(this.sdlSchemaExtensions.slice()).join('\n');
                this.astSchema = helper_1.graphQl.helper.parseGraphQlSchema(sdlSchemaCombined);
                this.dbMeta = graphQlSchemaToDbMeta_1.parseGraphQlJsonSchemaToDbMeta(this.astSchema);
                // load permissions and expressions and generate views and put them into schemas
                try {
                    // load permissions
                    const viewsPattern = this.ENVIRONMENT.path + this.graphQlConfig.viewsPattern;
                    const viewsArray = yield helper_2.helper.requireFilesByGlobPattern(viewsPattern);
                    this.views = [].concat.apply([], viewsArray);
                    // load expressions
                    const expressionsPattern = this.ENVIRONMENT.path + this.graphQlConfig.expressionsPattern;
                    const expressionsArray = yield helper_2.helper.requireFilesByGlobPattern(expressionsPattern);
                    this.expressions = [].concat.apply([], expressionsArray);
                    const viewSchemaName = di_1.Container.get(config_1.Config).getConfig('db').viewSchemaName;
                    const combinedSchemaInformation = parser_1.runtimeParser(this.astSchema, this.views, this.expressions, this.dbMeta, viewSchemaName, this.parsers);
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
};
GraphQlParser = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(1, di_1.Inject(type => config_1.Config)),
    __param(2, di_1.Inject(type => boot_loader_1.BootLoader)),
    __metadata("design:paramtypes", [Object, Object, Object])
], GraphQlParser);
exports.GraphQlParser = GraphQlParser;
