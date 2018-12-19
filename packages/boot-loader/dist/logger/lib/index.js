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
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("@fullstack-one/di");
const config_1 = require("@fullstack-one/config");
const Logger_1 = require("./Logger");
let LoggerFactory = class LoggerFactory {
    constructor(config) {
        this.config = config;
        // register package config
        this.CONFIG = this.config.registerConfig("Logger", `${__dirname}/../config`);
    }
    create(moduleName) {
        const env = di_1.Container.get("ENVIRONMENT");
        return new Logger_1.Logger(moduleName, this.CONFIG, env);
    }
};
LoggerFactory = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => config_1.Config)),
    __metadata("design:paramtypes", [config_1.Config])
], LoggerFactory);
exports.LoggerFactory = LoggerFactory;
