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
const events_1 = require("@fullstack-one/events");
const logger_1 = require("@fullstack-one/logger");
const db_1 = require("@fullstack-one/db");
const server_1 = require("@fullstack-one/server");
const boot_loader_1 = require("@fullstack-one/boot-loader");
// graceful exit
const exitHook = require("async-exit-hook");
const terminus = require("@godaddy/terminus");
let GracefulShutdown = class GracefulShutdown {
    constructor(eventEmitter, loggerFactory, bootLoader, dbAppClient, dbPoolObj, config) {
        this.eventEmitter = eventEmitter;
        this.dbAppClient = dbAppClient;
        this.dbPoolObj = dbPoolObj;
        this.logger = loggerFactory.create(this.constructor.name);
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    boot() {
        // get settings from DI container
        this.ENVIRONMENT = di_1.Container.get("ENVIRONMENT");
        terminus(di_1.Container.get(server_1.Server).getServer(), {
            // healtcheck options
            healthChecks: {
                // for now we only resolve a promise to make sure the server runs
                "/_health/liveness": () => Promise.resolve(),
                // make sure we are ready to answer requests
                "/_health/readiness": () => di_1.Container.get(boot_loader_1.BootLoader).getReadyPromise()
            },
            // cleanup options
            timeout: 1000,
            logger: this.logger.info
        });
        // release resources here before node exits
        exitHook((callback) => __awaiter(this, void 0, void 0, function* () {
            this.logger.info("exiting");
            this.logger.info("starting cleanup");
            this.emit("exiting", this.ENVIRONMENT.nodeId);
            try {
                // close DB connections - has to by synchronous - no await
                // try to exit as many as possible
                yield this.disconnectDB();
                this.logger.info("shutting down");
                this.emit("down", this.ENVIRONMENT.nodeId);
                // end exitHook
                return callback();
            }
            catch (err) {
                this.logger.warn("Error occurred during clean up attempt", err);
                this.emit("server.sigterm.error", this.ENVIRONMENT.nodeId, err);
                throw err;
            }
        }));
    }
    disconnectDB() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // end setup pgClient and pool
                yield Promise.all([this.dbAppClient.end(), this.dbPoolObj.end()]);
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
    emit(eventName, ...args) {
        // add namespace
        const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
        this.eventEmitter.emit(eventNamespaceName, this.ENVIRONMENT.nodeId, ...args);
    }
    on(eventName, listener) {
        // add namespace
        const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
        this.eventEmitter.on(eventNamespaceName, listener);
    }
};
GracefulShutdown = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => events_1.EventEmitter)),
    __param(1, di_1.Inject((type) => logger_1.LoggerFactory)),
    __param(2, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __param(3, di_1.Inject((type) => db_1.DbAppClient)),
    __param(4, di_1.Inject((type) => db_1.DbGeneralPool)),
    __param(5, di_1.Inject((type) => config_1.Config)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], GracefulShutdown);
exports.GracefulShutdown = GracefulShutdown;
