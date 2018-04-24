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
let DbAppClient = class DbAppClient {
    constructor(eventEmitter, loggerFactory, config) {
        // register package config
        config.addConfigFolder(__dirname + '/../config');
        // set DI dependencies
        this.eventEmitter = eventEmitter;
        this.logger = loggerFactory.create('DbAppClient');
        // get settings from DI container
        this.ENVIRONMENT = di_1.Container.get('ENVIRONMENT');
        const configDB = config.getConfig('db');
        this.credentials = configDB.appClient;
        this.applicationName = this.credentials.application_name = this.ENVIRONMENT.namespace + '_client_' + this.ENVIRONMENT.nodeId;
        // create PG pgClient
        this.pgClient = new pg_1.Client(this.credentials);
        this.logger.debug('Postgres setup pgClient created');
        this.eventEmitter.emit('db.application.pgClient.created', this.applicationName);
        // collect known nodes
        this.eventEmitter.onAnyInstance(`db.application.client.connect.success`, (nodeId) => {
            this.updateNodeIdsFromDb();
        });
        // update number of clients on exit
        this.eventEmitter.onAnyInstance(`db.application.client.end.start`, (nodeId) => {
            // wait one tick until it actually finishes
            process.nextTick(() => { this.updateNodeIdsFromDb(); });
        });
        // check connected clients every x secons
        const updateClientListInterval = configDB.updateClientListInterval || 10000;
        setInterval(this.updateNodeIdsFromDb.bind(this), updateClientListInterval);
        di_1.Container.get(boot_loader_1.BootLoader).addBootFunction(this.boot.bind(this));
    }
    end() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace('Postgres connection ending initiated');
            this.eventEmitter.emit('db.application.pgClient.end.start', this.applicationName);
            try {
                const clientEndResult = yield this.pgClient.end();
                this.logger.trace('Postgres connection ended successfully');
                // can only be caught locally (=> db connection ended)
                this.eventEmitter.emit('db.application.pgClient.end.success', this.applicationName);
                return clientEndResult;
            }
            catch (err) {
                this.logger.warn('Postgres connection ended with an error', err);
                this.eventEmitter.emit('db.application.pgClient.end.error', this.applicationName, err);
                throw err;
            }
        });
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.eventEmitter.emit('db.application.pgClient.connect.start', this.applicationName);
                // getSqlFromMigrationObj connection
                yield this.pgClient.connect();
                this.logger.trace('Postgres setup connection created');
                this.eventEmitter.emit('db.application.pgClient.connect.success', this.applicationName);
            }
            catch (err) {
                this.logger.warn('Postgres setup connection creation error', err);
                this.eventEmitter.emit('db.application.pgClient.connect.error', this.applicationName, err);
                throw err;
            }
            return this.pgClient;
        });
    }
    updateNodeIdsFromDb() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbName = this.credentials.database;
                const applicationNamePrefix = `${this.ENVIRONMENT.namespace}_client_`;
                const dbNodes = yield this.pgClient.query(`SELECT * FROM pg_stat_activity WHERE datname = '${dbName}' AND application_name LIKE '${applicationNamePrefix}%';`);
                // collect all connected node IDs
                const nodeIds = dbNodes.rows.map((row) => {
                    // remove prefix from node name and keep only node ID
                    return row.application_name.replace(applicationNamePrefix, '');
                });
                // check if number of nodes has changed
                let knownNodeIds = [];
                try {
                    knownNodeIds = di_1.Container.get('knownNodeIds');
                }
                catch (_a) {
                    // ignore error
                }
                if (knownNodeIds.length !== nodeIds.length) {
                    knownNodeIds = nodeIds;
                    // update known IDs in DI
                    di_1.Container.set('knownNodeIds', knownNodeIds);
                    this.logger.debug('Postgres number connected clients changed', knownNodeIds);
                    this.eventEmitter.emit('connected.nodes.changed');
                }
            }
            catch (err) {
                this.logger.warn('updateNodeIdsFromDb', err);
            }
        });
    }
};
DbAppClient = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => events_1.EventEmitter)),
    __param(1, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(2, di_1.Inject(type => config_1.Config)),
    __metadata("design:paramtypes", [Object, Object, Object])
], DbAppClient);
exports.DbAppClient = DbAppClient;
