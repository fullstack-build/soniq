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
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("@fullstack-one/di");
const path = require("path");
const fs = require("fs");
const crypto_1 = require("crypto");
const _ = require("lodash");
let Config = class Config {
    constructor() {
        // load project package.js
        const projectPath = path.dirname(require.main.filename);
        const PROJECT_PACKAGE = require(`${projectPath}/package.json`);
        // ENV CONST
        this.ENVIRONMENT = {
            NODE_ENV: process.env.NODE_ENV,
            name: PROJECT_PACKAGE.name,
            path: projectPath,
            port: parseInt(process.env.PORT, 10),
            version: PROJECT_PACKAGE.version,
            // getSqlFromMigrationObj unique instance ID (6 char)
            nodeId: crypto_1.randomBytes(20).toString('hex').substr(5, 6),
            namespace: 'one' // default
        };
        // load config
        this.loadConfig();
        // set namespace from config
        this.ENVIRONMENT.namespace = this.getConfig('core').namespace;
        // put ENVIRONMENT into DI
        di_1.Container.set('ENVIRONMENT', this.ENVIRONMENT);
    }
    getConfig(pModuleName) {
        const config = di_1.Container.get('CONFIG');
        if (pModuleName == null) {
            // return copy instead of a ref
            return Object.assign({}, config);
        }
        else {
            // return copy instead of a ref
            return Object.assign({}, config[pModuleName]);
        }
    }
    // load config based on ENV
    loadConfig() {
        // framework config path
        const frameworkConfigPath = `./default`;
        // project config paths
        const mainConfigPath = `${this.ENVIRONMENT.path}/config/default.ts`;
        const envConfigPath = `${this.ENVIRONMENT.path}/config/${this.ENVIRONMENT.NODE_ENV}.ts`;
        // load framework config file
        let config = require(frameworkConfigPath);
        // extend framework config
        // with project config (so it can override framework settings
        if (!!fs.existsSync(mainConfigPath)) {
            config = _.merge(config, require(mainConfigPath));
        }
        // extend with env config
        if (!!fs.existsSync(envConfigPath)) {
            config = _.merge(config, require(envConfigPath));
        }
        // put config into DI
        di_1.Container.set('CONFIG', config);
    }
};
Config = __decorate([
    di_1.Service(),
    __metadata("design:paramtypes", [])
], Config);
exports.Config = Config;
