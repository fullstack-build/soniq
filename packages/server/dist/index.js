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
// import { EventEmitter } from '@fullstack-one/events';
const logger_1 = require("@fullstack-one/logger");
const boot_loader_1 = require("@fullstack-one/boot-loader");
const http = require("http");
// other npm dependencies
const Koa = require("koa");
let Server = class Server {
    // private eventEmitter: EventEmitter;
    constructor(
    // @Inject(type => EventEmitter) eventEmitter?,
    loggerFactory, config, bootLoader) {
        this.config = config;
        this.loggerFactory = loggerFactory;
        // register package config
        config.registerConfig('Server', __dirname + '/../config');
        // this.eventEmitter = eventEmitter;
        this.logger = this.loggerFactory.create(this.constructor.name);
        // get settings from DI container
        this.serverConfig = this.config.getConfig('Server');
        this.ENVIRONMENT = di_1.Container.get('ENVIRONMENT');
        this.bootKoa();
        bootLoader.addBootFunction(this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // start KOA on PORT
                this.server = http.createServer(this.app.callback()).listen(this.serverConfig.port);
                // emit event
                this.emit('server.up', this.serverConfig.port);
                // success log
                this.logger.info('Server listening on port', this.serverConfig.port);
            }
            catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
            }
        });
    }
    getApp() {
        return this.app;
    }
    getServer() {
        return this.server;
    }
    bootKoa() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.app = new Koa();
            }
            catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
            }
        });
    }
    emit(eventName, ...args) {
        // add namespace
        const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
        // this.eventEmitter.emit(eventNamespaceName, this.ENVIRONMENT.nodeId, ...args);
    }
    on(eventName, listener) {
        // add namespace
        const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
        // this.eventEmitter.on(eventNamespaceName, listener);
    }
};
Server = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => logger_1.LoggerFactory)),
    __param(1, di_1.Inject(type => config_1.Config)),
    __param(2, di_1.Inject(tpye => boot_loader_1.BootLoader)),
    __metadata("design:paramtypes", [Object, Object, Object])
], Server);
exports.Server = Server;
