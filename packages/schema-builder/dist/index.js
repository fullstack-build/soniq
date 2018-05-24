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
const gql_schema_builder_1 = require("./gql-schema-builder");
const gQlAstToDbMeta_1 = require("./db-schema-builder/graphql/gQlAstToDbMeta");
const pgToDbMeta_1 = require("./db-schema-builder/pg/pgToDbMeta");
// fullstack-one core
const di_1 = require("@fullstack-one/di");
// DI imports
const logger_1 = require("@fullstack-one/logger");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const db_schema_builder_1 = require("./db-schema-builder");
const helper_2 = require("@fullstack-one/helper");
const utils = require("./gql-schema-builder/utils");
exports.utils = utils;
let SchemaBuilder = class SchemaBuilder {
    constructor(loggerFactory, config, bootLoader, dbSchemaBuilder, pgToDbMeta) {
        this.gQlSdlExtensions = [];
        this.parsers = [];
        // register package config
        config.addConfigFolder(__dirname + '/gql-schema-builder/config');
        this.dbSchemaBuilder = dbSchemaBuilder;
        this.pgToDbMeta = pgToDbMeta;
        this.logger = loggerFactory.create('SchemaBuilder');
        this.graphQlConfig = config.getConfig('graphql');
        this.ENVIRONMENT = config.ENVIRONMENT;
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    getDbSchemaBuilder() {
        return this.dbSchemaBuilder;
    }
    getRegisterDirectiveParser() {
        return this.dbSchemaBuilder.registerDirectiveParser.bind(this.dbSchemaBuilder);
    }
    getPgDbMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.pgToDbMeta.getPgDbMeta();
        });
    }
    addParser(parser) {
        this.parsers.push(parser);
    }
    getDbMeta() {
        return this.dbMeta;
    }
    extendSchema(schema) {
        this.gQlSdlExtensions.push(schema);
    }
    getGQlRuntimeObject() {
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
    getGQlSdl() {
        // return copy insted of ref
        return Object.assign({}, this.gQlSdl);
    }
    getGQlAst() {
        // return copy insted of ref
        return Object.assign({}, this.gQlAst);
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // load schema
                const gQlSdlPattern = this.ENVIRONMENT.path + this.graphQlConfig.schemaPattern;
                this.gQlSdl = yield helper_2.helper.loadFilesByGlobPattern(gQlSdlPattern);
                // check if any files were loaded
                if (this.gQlSdl.length === 0) {
                    this.logger.warn('boot.no.sdl.files.found');
                    return;
                }
                // Combine all Schemas to a big one and add extensions from other modules
                const gQlSdlCombined = this.gQlSdl.concat(this.gQlSdlExtensions.slice()).join('\n');
                this.gQlAst = helper_1.graphQl.helper.parseGraphQlSchema(gQlSdlCombined);
                this.dbMeta = gQlAstToDbMeta_1.parseGQlAstToDbMeta(this.gQlAst, this.dbSchemaBuilder.getDirectiveParser());
                // load permissions and expressions and generate views and put them into schemas
                // load permissions
                const viewsPattern = this.ENVIRONMENT.path + this.graphQlConfig.viewsPattern;
                const viewsArray = yield helper_2.helper.requireFilesByGlobPattern(viewsPattern);
                this.views = [].concat.apply([], viewsArray);
                // load expressions
                const expressionsPattern = this.ENVIRONMENT.path + this.graphQlConfig.expressionsPattern;
                const expressionsArray = yield helper_2.helper.requireFilesByGlobPattern(expressionsPattern);
                this.expressions = [].concat.apply([], expressionsArray);
                const viewSchemaName = di_1.Container.get(config_1.Config).getConfig('db').viewSchemaName;
                const combinedSchemaInformation = gql_schema_builder_1.gqlSchemaBuilder(this.gQlAst, this.views, this.expressions, this.dbMeta, viewSchemaName, this.parsers);
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
                return this.dbMeta;
            }
            catch (err) {
                this.logger.warn('boot.error', err);
                throw err;
            }
        });
    }
};
SchemaBuilder = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(1, di_1.Inject(type => config_1.Config)),
    __param(2, di_1.Inject(type => boot_loader_1.BootLoader)),
    __param(3, di_1.Inject(type => db_schema_builder_1.DbSchemaBuilder)),
    __param(4, di_1.Inject(type => pgToDbMeta_1.PgToDbMeta)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], SchemaBuilder);
exports.SchemaBuilder = SchemaBuilder;
