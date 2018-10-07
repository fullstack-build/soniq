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
const events_1 = require("@fullstack-one/events");
const logger_1 = require("@fullstack-one/logger");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const pg_1 = require("pg");
exports.PgClient = pg_1.Client;
// stop pg from parsing dates and timestamps without timezone
pg_1.types.setTypeParser(1114, (str) => str);
pg_1.types.setTypeParser(1082, (str) => str);
let DbAppClient = class DbAppClient {
    constructor(bootLoader, eventEmitter, loggerFactory, config) {
        // set DI dependencies
        this.config = config;
        this.eventEmitter = eventEmitter;
        // register package config
        this.CONFIG = this.config.registerConfig("Db", `${__dirname}/../config`);
        this.credentials = this.CONFIG.appClient;
        // get settings from DI container
        this.ENVIRONMENT = di_1.Container.get("ENVIRONMENT");
        // init logger
        this.logger = loggerFactory.create(this.constructor.name);
        // add to boot loader
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            this.applicationNamePrefix = `${this.ENVIRONMENT.namespace}_client_`;
            this.applicationName = this.CONFIG.application_name = `${this.applicationNamePrefix}${this.ENVIRONMENT.nodeId}`;
            // create PG pgClient / add application name
            this.pgClient = new pg_1.Client(Object.assign({}, this.credentials, { application_name: this.applicationName }));
            this.logger.debug("Postgres setup pgClient created");
            this.eventEmitter.emit("db.application.client.created", this.applicationName);
            // collect known nodes
            this.eventEmitter.onAnyInstance("db.application.client.connect.success", (nodeId) => {
                this.updateNodeIdsFromDb();
            });
            // update number of clients on exit
            this.eventEmitter.onAnyInstance("db.application.client.end.start", (nodeId) => {
                // wait one tick until it actually finishes
                process.nextTick(() => {
                    this.updateNodeIdsFromDb();
                });
            });
            // fall back to graceful shutdown exiting, in case the event 'db.application.client.end.start' wasn't caught
            this.eventEmitter.onAnyInstance(`${this.ENVIRONMENT.namespace}.exiting`, (nodeId) => {
                // wait one tick until it actually finishes
                process.nextTick(() => {
                    this.updateNodeIdsFromDb();
                });
            });
            // check connected clients every x seconds / backup in case we missed one
            const updateClientListInterval = this.CONFIG.updateClientListInterval || 10000;
            setInterval(this.updateNodeIdsFromDb.bind(this), updateClientListInterval);
            try {
                this.eventEmitter.emit("db.application.client.connect.start", this.applicationName);
                // getSqlFromMigrationObj connection
                yield this.pgClient.connect();
                this.logger.trace("Postgres setup connection created");
                this.eventEmitter.emit("db.application.client.connect.success", this.applicationName);
                // update list of known nodes // this will ad our own ID into the list
                yield this.updateNodeIdsFromDb();
            }
            catch (err) {
                this.logger.warn("Postgres setup connection creation error", err);
                this.eventEmitter.emit("db.application.client.connect.error", this.applicationName, err);
                throw err;
            }
            return this.pgClient;
        });
    }
    updateNodeIdsFromDb() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbName = this.credentials.database;
                const dbNodes = yield this.pgClient.query(`SELECT * FROM pg_stat_activity WHERE datname = '${dbName}' AND application_name LIKE '${this.applicationNamePrefix}%';`);
                // collect all connected node IDs
                const nodeIds = dbNodes.rows.map((row) => {
                    // remove prefix from node name and keep only node ID
                    return row.application_name.replace(this.applicationNamePrefix, "");
                });
                // check if number of nodes has changed
                let knownNodeIds = [];
                try {
                    // TODO: Evaluate if its a good idea to push it into container or keep it as a public readonly property of DB
                    knownNodeIds = di_1.Container.get("knownNodeIds");
                }
                catch (_a) {
                    // ignore error
                }
                if (knownNodeIds.length !== nodeIds.length) {
                    knownNodeIds = nodeIds;
                    // update known IDs in DI
                    di_1.Container.set("knownNodeIds", knownNodeIds);
                    this.logger.debug("Postgres number connected clients changed", knownNodeIds);
                    this.eventEmitter.emit("connected.nodes.changed");
                }
            }
            catch (err) {
                this.logger.warn("updateNodeIdsFromDb", err);
            }
        });
    }
    end() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("Postgres connection ending initiated");
            this.eventEmitter.emit("db.application.client.end.start", this.applicationName);
            try {
                const clientEndResult = yield this.pgClient.end();
                this.logger.trace("Postgres connection ended successfully");
                // can only be caught locally (=> db connection ended)
                this.eventEmitter.emit("db.application.client.end.success", this.applicationName);
                return clientEndResult;
            }
            catch (err) {
                this.logger.warn("Postgres connection ended with an error", err);
                this.eventEmitter.emit("db.application.client.end.error", this.applicationName, err);
                throw err;
            }
        });
    }
};
DbAppClient = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __param(1, di_1.Inject((type) => events_1.EventEmitter)),
    __param(2, di_1.Inject((type) => logger_1.LoggerFactory)),
    __param(3, di_1.Inject((type) => config_1.Config)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], DbAppClient);
exports.DbAppClient = DbAppClient;
