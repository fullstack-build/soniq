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
// fullstack-one core
const di_1 = require("@fullstack-one/di");
// DI imports
const logger_1 = require("@fullstack-one/logger");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const db_schema_builder_1 = require("./db-schema-builder");
const helper_1 = require("@fullstack-one/helper");
const utils = require("./gql-schema-builder/utils");
exports.utils = utils;
// import sub modules
const helper_2 = require("./helper");
const gql_schema_builder_1 = require("./gql-schema-builder");
const gQlAstToDbMeta_1 = require("./db-schema-builder/fromGQl/gQlAstToDbMeta");
const pgToDbMeta_1 = require("./db-schema-builder/fromPg/pgToDbMeta");
// export for extensions
// helper: splitActionFromNode
var helper_3 = require("./db-schema-builder/helper");
exports.splitActionFromNode = helper_3.splitActionFromNode;
// create constraint
var gQlAstToDbMetaHelper_1 = require("./db-schema-builder/fromGQl/gQlAstToDbMetaHelper");
exports.createConstraint = gQlAstToDbMetaHelper_1.createConstraint;
// GQL parser
var gQlAstToDbMeta_2 = require("./db-schema-builder/fromGQl/gQlAstToDbMeta");
exports.registerDirectiveParser = gQlAstToDbMeta_2.registerDirectiveParser;
// PG Query parser
var pgToDbMeta_2 = require("./db-schema-builder/fromPg/pgToDbMeta");
exports.registerQueryParser = pgToDbMeta_2.registerQueryParser;
// PG parser
var pgToDbMeta_3 = require("./db-schema-builder/fromPg/pgToDbMeta");
exports.registerTriggerParser = pgToDbMeta_3.registerTriggerParser;
// migrations
var createSqlObjFromMigrationObject_1 = require("./db-schema-builder/toPg/createSqlObjFromMigrationObject");
exports.registerColumnMigrationExtension = createSqlObjFromMigrationObject_1.registerColumnMigrationExtension;
exports.registerTableMigrationExtension = createSqlObjFromMigrationObject_1.registerTableMigrationExtension;
let SchemaBuilder = class SchemaBuilder {
    constructor(loggerFactory, config, bootLoader, dbSchemaBuilder, pgToDbMeta) {
        this.gQlSdlExtensions = [];
        this.parsers = [];
        // register package config
        config.addConfigFolder(__dirname + '/../config');
        this.dbSchemaBuilder = dbSchemaBuilder;
        this.pgToDbMeta = pgToDbMeta;
        this.logger = loggerFactory.create('SchemaBuilder');
        this.graphQlConfig = config.getConfig('graphql');
        this.ENVIRONMENT = config.ENVIRONMENT;
        bootLoader.addBootFunction(this.boot.bind(this));
        this.getDbSchemaBuilder().addMigrationPath(__dirname + '/..');
    }
    getDbSchemaBuilder() {
        return this.dbSchemaBuilder;
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
        // return copy instead of ref
        return Object.assign({}, this.gQlSdl);
    }
    getGQlAst() {
        // return copy instead of ref
        return Object.assign({}, this.gQlAst);
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // load schema
                const gQlSdlPattern = this.ENVIRONMENT.path + this.graphQlConfig.schemaPattern;
                this.gQlSdl = yield helper_1.helper.loadFilesByGlobPattern(gQlSdlPattern);
                // check if any files were loaded
                if (this.gQlSdl.length === 0) {
                    this.logger.warn('boot.no.sdl.files.found');
                    return;
                }
                // Combine all Schemas to a big one and add extensions from other modules
                const gQlSdlCombined = this.gQlSdl.concat(this.gQlSdlExtensions.slice()).join('\n');
                this.gQlAst = helper_2.graphQl.helper.parseGraphQlSchema(gQlSdlCombined);
                this.dbMeta = gQlAstToDbMeta_1.parseGQlAstToDbMeta(this.gQlAst);
                // load permissions and expressions and generate views and put them into schemas
                // load permissions
                const viewsPattern = this.ENVIRONMENT.path + this.graphQlConfig.viewsPattern;
                const viewsArray = yield helper_1.helper.requireFilesByGlobPattern(viewsPattern);
                this.views = [].concat.apply([], viewsArray);
                // load expressions
                const expressionsPattern = this.ENVIRONMENT.path + this.graphQlConfig.expressionsPattern;
                const expressionsArray = yield helper_1.helper.requireFilesByGlobPattern(expressionsPattern);
                this.expressions = [].concat.apply([], expressionsArray);
                const viewSchemaName = di_1.Container.get(config_1.Config).getConfig('db').viewSchemaName;
                const combinedSchemaInformation = gql_schema_builder_1.gqlSchemaBuilder(this.gQlAst, this.views, this.expressions, this.dbMeta, viewSchemaName, this.parsers);
                this.gQlRuntimeDocument = combinedSchemaInformation.document;
                this.gQlRuntimeSchema = helper_2.graphQl.helper.printGraphQlDocument(this.gQlRuntimeDocument);
                this.gQlTypes = combinedSchemaInformation.gQlTypes;
                this.queries = combinedSchemaInformation.queries;
                this.mutations = combinedSchemaInformation.mutations;
                this.customOperations = {
                    fields: combinedSchemaInformation.customFields,
                    queries: combinedSchemaInformation.customQueries,
                    mutations: combinedSchemaInformation.customMutations
                };
                // copy view objects into dbMeta
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
