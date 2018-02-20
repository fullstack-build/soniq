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
const ONE = require("fullstack-one");
let QueueFactory = class QueueFactory extends ONE.AbstractPackage {
    constructor(loggerFactory) {
        super();
        // set DI dependencies
        this.logger = loggerFactory.create('Queue');
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
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            let boss;
            const queueConfig = this.getConfig('queue');
            // create new connection if set in config, otherwise use one from the pool
            if (queueConfig != null &&
                queueConfig.host &&
                queueConfig.database &&
                queueConfig.user &&
                queueConfig.password) {
                // create a PGBoss instance
                boss = new PgBoss(queueConfig);
            }
            else {
                // get new connection from the pool
                const pgCon = yield this.generalPool.connect();
                // Add `close` and `executeSql` functions for PgBoss to function
                const pgBossDB = Object.assign(pgCon, {
                    close: pgCon.end,
                    executeSql: pgCon.query
                });
                // create a PGBoss instance
                boss = new PgBoss(Object.assign({ db: pgBossDB }, queueConfig));
            }
            // log errors to warn
            boss.on('error', this.logger.warn);
            // try to start PgBoss
            try {
                this.queue = yield boss.start();
            }
            catch (err) {
                this.logger.warn('start.error', err);
            }
            return this.queue;
        });
    }
};
__decorate([
    ONE.Inject(),
    __metadata("design:type", ONE.DbGeneralPool)
], QueueFactory.prototype, "generalPool", void 0);
QueueFactory = __decorate([
    ONE.Service(),
    __param(0, ONE.Inject(type => ONE.LoggerFactory)),
    __metadata("design:paramtypes", [Object])
], QueueFactory);
exports.QueueFactory = QueueFactory;
