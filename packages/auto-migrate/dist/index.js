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
const di_1 = require("@fullstack-one/di");
const config_1 = require("@fullstack-one/config");
const migration_1 = require("@fullstack-one/migration");
const logger_1 = require("@fullstack-one/logger");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const db_1 = require("@fullstack-one/db");
const graphql_parser_1 = require("@fullstack-one/graphql-parser");
const _ = require("lodash");
let AutoMigrate = class AutoMigrate {
    constructor(loggerFactory, bootLoader, migration, config, gqlParser, dbAppClient) {
        this.logger = loggerFactory.create('AutoMigrate');
        this.gqlParser = gqlParser;
        this.config = config;
        this.migration = migration;
        // get settings from DI container
        this.ENVIRONMENT = di_1.Container.get('ENVIRONMENT');
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Check config automigrate
            return yield this.runMigration();
        });
    }
    getDbMeta() {
        // return copy instead of ref
        return _.cloneDeep(this.gqlParser.getDbMeta());
    }
    getMigrationSql() {
        return __awaiter(this, void 0, void 0, function* () {
            const configDB = this.config.getConfig('db');
            try {
                const fromDbMeta = yield (new db_1.PgToDbMeta()).getPgDbMeta();
                const toDbMeta = this.getDbMeta();
                return this.migration.getMigrationSqlStatements(fromDbMeta, toDbMeta, configDB.renameInsteadOfDrop);
            }
            catch (err) {
                this.logger.warn('getMigrationSql.error', err);
            }
        });
    }
    runMigration() {
        return __awaiter(this, void 0, void 0, function* () {
            const configDB = this.config.getConfig('db');
            try {
                const pgToDbMeta = di_1.Container.get(db_1.PgToDbMeta);
                const fromDbMeta = yield pgToDbMeta.getPgDbMeta();
                const toDbMeta = this.getDbMeta();
                return yield this.migration.migrate(fromDbMeta, toDbMeta, configDB.renameInsteadOfDrop);
            }
            catch (err) {
                this.logger.warn('runMigration.error', err);
            }
        });
    }
};
AutoMigrate = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(1, di_1.Inject(type => boot_loader_1.BootLoader)),
    __param(2, di_1.Inject(type => migration_1.Migration)),
    __param(3, di_1.Inject(type => config_1.Config)),
    __param(4, di_1.Inject(type => graphql_parser_1.GraphQlParser)),
    __param(5, di_1.Inject(type => db_1.DbAppClient)),
    __metadata("design:paramtypes", [logger_1.LoggerFactory,
        boot_loader_1.BootLoader,
        migration_1.Migration,
        config_1.Config,
        graphql_parser_1.GraphQlParser,
        db_1.DbAppClient])
], AutoMigrate);
exports.AutoMigrate = AutoMigrate;
