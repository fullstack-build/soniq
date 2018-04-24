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
const _ = require("lodash");
const crypto_1 = require("crypto");
let Config = class Config {
    constructor() {
        this.configFolder = [];
        this.config = {};
        // load project package.js
        const projectPath = path.dirname(require.main.filename);
        // each package in the mono repo has the same version
        const PROJECT_PACKAGE = require(`../package.json`);
        // ENV CONST
        this.ENVIRONMENT = {
            NODE_ENV: process.env.NODE_ENV,
            name: PROJECT_PACKAGE.name,
            path: projectPath,
            port: parseInt(process.env.PORT, 10),
            version: PROJECT_PACKAGE.version,
            // unique instance ID (6 char)
            nodeId: crypto_1.randomBytes(20).toString('hex').substr(5, 6),
            namespace: 'one' // default
        };
        // load package config
        this.addConfigFolder(__dirname + '/../config');
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
    addConfigFolder(configPath) {
        // check if path was already included
        if (!this.configFolder.includes(configPath)) {
            this.configFolder.push(configPath);
        }
        // config files
        const mainConfigPath = `${configPath}/default.js`;
        const envConfigPath = `${configPath}/${this.ENVIRONMENT.NODE_ENV}.js`;
        // require config files
        let config = null;
        // require default config - fail if not found
        try {
            config = require(mainConfigPath);
        }
        catch (err) {
            process.stderr.write('config.default.loading.error.not.found: ' + mainConfigPath + '\n');
            process.exit();
        }
        // try to load env config – ignore if not found
        try {
            config = _.merge(config, require(envConfigPath));
        }
        catch (err) {
            // ignore if not found
        }
        // check loaded config for undefined settings
        let foundMissingConfig = false;
        this.deepMapHelper(config, (val, key) => {
            if (val == null) {
                process.stderr.write(`config.not.set: ${key}` + '\n');
                foundMissingConfig = true;
            }
        });
        // missing config found?
        if (!!foundMissingConfig) {
            process.exit();
        }
        // everything seems to be fine so far -> merge with the global settings object
        this.config = _.merge(this.config, config);
        // put config into DI
        di_1.Container.set('CONFIG', this.config);
    }
    deepMapHelper(obj, iterator, context) {
        return _.transform(obj, (result, val, key) => {
            result[key] = _.isObject(val) /*&& !_.isDate(val)*/ ?
                this.deepMapHelper(val, iterator, context) :
                iterator.call(context, val, key, obj);
        });
    }
};
Config = __decorate([
    di_1.Service(),
    __metadata("design:paramtypes", [])
], Config);
exports.Config = Config;
