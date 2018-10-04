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
const PgBoss = require("pg-boss");
exports.PgBoss = PgBoss;
const di_1 = require("@fullstack-one/di");
const logger_1 = require("@fullstack-one/logger");
const db_1 = require("@fullstack-one/db");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
let QueueFactory = class QueueFactory {
    constructor(bootLoader, loggerFactory, generalPool, config) {
        // set DI dependencies
        this.generalPool = generalPool;
        // register package config
        config.registerConfig("Queue", `${__dirname}/../config`);
        // init logger
        this.logger = loggerFactory.create(this.constructor.name);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            let boss;
            const queueConfig = di_1.Container.get(config_1.Config).getConfig("Queue");
            // create new connection if set in config, otherwise use one from the pool
            if (queueConfig != null && queueConfig.host && queueConfig.database && queueConfig.user && queueConfig.password) {
                // create a PGBoss instance
                boss = new PgBoss(queueConfig);
            }
            else {
                if (this.generalPool.pgPool == null) {
                    throw Error("DB.generalPool not ready");
                }
                // get new connection from the pool
                const pgCon = yield this.generalPool.pgPool.connect();
                // Add `close` and `executeSql` functions for PgBoss to function
                const pgBossDB = Object.assign({}, pgCon, { close: pgCon.release, executeSql: pgCon.query });
                // create a PGBoss instance
                boss = new PgBoss(Object.assign({ db: pgBossDB }, queueConfig));
            }
            // log errors to warn
            boss.on("error", this.logger.warn);
            // try to start PgBoss
            try {
                this.queue = yield boss.start();
            }
            catch (err) {
                this.logger.warn("start.error", err);
            }
            return this.queue;
        });
    }
    getQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            // create queue if not yet available
            if (this.queue == null) {
                yield this.start();
            }
            return this.queue;
        });
    }
};
QueueFactory = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __param(1, di_1.Inject((type) => logger_1.LoggerFactory)),
    __param(2, di_1.Inject((type) => db_1.DbGeneralPool)),
    __param(3, di_1.Inject((type) => config_1.Config)),
    __metadata("design:paramtypes", [Object, Object, Object, config_1.Config])
], QueueFactory);
exports.QueueFactory = QueueFactory;
