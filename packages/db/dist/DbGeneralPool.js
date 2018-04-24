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
const pg_1 = require("pg");
exports.PgPool = pg_1.Pool;
const di_1 = require("@fullstack-one/di");
const events_1 = require("@fullstack-one/events");
const logger_1 = require("@fullstack-one/logger");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
let DbGeneralPool = class DbGeneralPool {
    constructor(eventEmitter, loggerFactory, config) {
        // register package config
        config.addConfigFolder(__dirname + '/../config');
        // DI
        this.eventEmitter = eventEmitter;
        this.logger = loggerFactory.create('DbGeneralPool');
        const env = di_1.Container.get('ENVIRONMENT');
        this.config = config.getConfig('db').general;
        this.applicationName = env.namespace + '_pool_' + env.nodeId;
        this.eventEmitter.on('connected.nodes.changed', (nodeId) => { this.gracefullyAdjustPoolSize(); });
        // calculate pool size and create pool
        // this.gracefullyAdjustPoolSize();
        di_1.Container.get(boot_loader_1.BootLoader).addBootFunction(this.gracefullyAdjustPoolSize.bind(this));
    }
    end() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace('Postgres pool ending initiated');
            this.eventEmitter.emit('db.application.pool.end.start', this.applicationName);
            try {
                const poolEndResult = yield this.managedPool.end();
                this.logger.trace('Postgres pool ended successfully');
                // can only be caught locally (=> db connection ended)
                this.eventEmitter.emit('db.application.pool.end.success', this.applicationName);
                return poolEndResult;
            }
            catch (err) {
                this.logger.warn('Postgres pool ended with an error', err);
                this.eventEmitter.emit('db.application.pool.end.error', this.applicationName, err);
                throw err;
            }
        });
    }
    // return public readonly instance of the managed pool
    get pgPool() {
        return this.managedPool;
    }
    // calculate number of max conections and adjust pool based on number of connected nodes
    gracefullyAdjustPoolSize() {
        return __awaiter(this, void 0, void 0, function* () {
            // get known nodes from container, initially assume we are the first one
            let knownNodesCount = 1;
            try {
                const knownNodes = di_1.Container.get('knownNodeIds');
                knownNodesCount = knownNodes.length;
            }
            catch (_a) {
                // ignore error and continue assuming we are the first client
            }
            // reserve one for setup connection
            const connectionsPerInstance = Math.floor((this.config.totalMax / knownNodesCount) - 1);
            // readjust pool only if number of max connections has changed
            if (this.credentials == null || this.credentials.max !== connectionsPerInstance) {
                // gracefully end previous pool if already available
                if (this.managedPool != null) {
                    // don't wait for promise, we just immediately create a new pool
                    // this one will end as soon as the last connection is released
                    this.end();
                }
                // credentials for general connection pool with calculated pool size
                this.credentials = Object.assign({}, this.config, { application_name: this.applicationName, max: connectionsPerInstance });
                // create managed pool with calculated pool size
                this.managedPool = new pg_1.Pool(this.credentials);
                this.logger.debug(`Postgres pool created (min: ${this.credentials.min} / max: ${this.credentials.max})`);
                this.eventEmitter.emit('db.general.pool.created', this.applicationName);
                // init first connection (ignore promise, connection only for "pre-heating" purposes)
                return yield this.initConnect();
            }
        });
    }
    initConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // emit event
                this.eventEmitter.emit('db.application.pgClient.connect.start', this.applicationName);
                // create first connection to test the pool
                const poolClient = yield this.managedPool.connect();
                this.logger.trace('Postgres pool initial connection created');
                this.eventEmitter.emit('db.application.pool.connect.success', this.applicationName);
                // release initial connection
                yield poolClient.release();
                this.logger.trace('Postgres pool initial connection released');
                this.eventEmitter.emit('db.application.pool.connect.released', this.applicationName);
            }
            catch (err) {
                this.logger.warn('Postgres pool connection creation error', err);
                this.eventEmitter.emit('db.application.pool.connect.error', this.applicationName, err);
                throw err;
            }
            return this.pgPool;
        });
    }
};
DbGeneralPool = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => events_1.EventEmitter)),
    __param(1, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(2, di_1.Inject(type => config_1.Config)),
    __metadata("design:paramtypes", [Object, Object, Object])
], DbGeneralPool);
exports.DbGeneralPool = DbGeneralPool;
