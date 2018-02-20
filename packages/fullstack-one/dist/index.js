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
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// ENV
const dotenv = require("dotenv-safe");
// DI
require("reflect-metadata");
const typedi_1 = require("typedi");
__export(require("typedi"));
// graceful exit
const onExit = require("signal-exit");
const terminus = require("@godaddy/terminus");
// node dependencies
const path = require("path");
const fs = require("fs");
const http = require("http");
// other npm dependencies
const fastGlob = require("fast-glob");
const Koa = require("koa");
const _ = require("lodash");
const crypto_1 = require("crypto");
// fullstack-one necessary imports
const AbstractPackage_1 = require("./AbstractPackage");
exports.AbstractPackage = AbstractPackage_1.AbstractPackage;
const helper_1 = require("@fullstack-one/helper");
exports.helper = helper_1.helper;
const logger_1 = require("@fullstack-one/logger");
exports.LoggerFactory = logger_1.LoggerFactory;
const events_1 = require("@fullstack-one/events");
exports.EventEmitter = events_1.EventEmitter;
const db_1 = require("@fullstack-one/db");
exports.DbAppClient = db_1.DbAppClient;
exports.DbGeneralPool = db_1.DbGeneralPool;
// fullstack.one optional imports
const graphql_1 = require("@fullstack-one/graphql");
const migration_1 = require("@fullstack-one/migration");
// init .env -- check if all are set
try {
    dotenv.config({
        // .env.example is in fullstack-one root folder
        sample: `${__dirname}/../../../.env.example`,
    });
}
catch (err) {
    process.stderr.write(err.toString() + '\n');
    process.exit(1);
}
let FullstackOneCore = class FullstackOneCore extends AbstractPackage_1.AbstractPackage {
    constructor(loggerFactory) {
        super();
        this.hasBooted = false;
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
        typedi_1.Container.set('ENVIRONMENT', this.ENVIRONMENT);
        // init core logger after ENVIRONMENT was set
        this.logger = loggerFactory.create('core');
        this.logger.trace('starting...');
        // init event emitter after ENVIRONMENT was set
        this.eventEmitter = typedi_1.Container.get(events_1.EventEmitter);
        // continue booting async on next tick
        // (is needed in order to be able to call getInstance from outside)
        process.nextTick(() => { this.bootAsync(); });
    }
    /**
     * PUBLIC METHODS
     */
    // return whether server is ready
    get isReady() {
        return this.hasBooted;
    }
    // return koa app
    get app() {
        return this.APP;
    }
    // return DB object
    getDbMeta() {
        // return copy instead of ref
        return _.cloneDeep(this.dbMeta);
    }
    getMigrationSql() {
        return __awaiter(this, void 0, void 0, function* () {
            const configDB = this.getConfig('db');
            try {
                const fromDbMeta = yield (new db_1.PgToDbMeta()).getPgDbMeta();
                const toDbMeta = this.getDbMeta();
                const migration = new migration_1.Migration(fromDbMeta, toDbMeta);
                return migration.getMigrationSqlStatements(configDB.renameInsteadOfDrop);
            }
            catch (err) {
                // tslint:disable-next-line:no-console
                console.error('ERROR', err);
            }
        });
    }
    runMigration() {
        return __awaiter(this, void 0, void 0, function* () {
            const configDB = this.getConfig('db');
            try {
                const pgToDbMeta = typedi_1.Container.get(db_1.PgToDbMeta);
                const fromDbMeta = yield pgToDbMeta.getPgDbMeta();
                const toDbMeta = this.getDbMeta();
                const migration = new migration_1.Migration(fromDbMeta, toDbMeta);
                return yield migration.migrate(configDB.renameInsteadOfDrop);
            }
            catch (err) {
                // tslint:disable-next-line:no-console
                this.logger.warn('runMigration.error', err);
            }
        });
    }
    /**
     * PRIVATE METHODS
     */
    // boot async and fire event when ready
    bootAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // connect Db
                yield this.connectDB();
                const graphQl = typedi_1.Container.get(graphql_1.GraphQl);
                // boot GraphQL and add endpoints
                this.dbMeta = yield graphQl.boot();
                this.emit('dbMeta.set');
                // run auto migration, if enabled
                const configDB = this.getConfig('db');
                if (configDB.automigrate === true) {
                    yield this.runMigration();
                }
                // start server
                yield this.startServer();
                // add GraphQL endpoints
                yield graphQl.addEndpoints();
                // execute book scripts
                yield this.executeBootScripts();
                // draw cli
                this.cliArt();
                // emit ready event
                this.hasBooted = true;
                this.emit('ready', this.ENVIRONMENT.nodeId);
            }
            catch (err) {
                // tslint:disable-next-line:no-console
                console.error('An error occurred while booting', err);
                this.logger.error('An error occurred while booting', err);
                this.emit('not-ready', err);
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
    // load config based on ENV
    loadConfig() {
        // framework config path
        const frameworkConfigPath = `../../../config/default.ts`;
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
        typedi_1.Container.set('CONFIG', config);
    }
    // connect to setup db and getSqlFromMigrationObj a general connection pool
    connectDB() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // create dbAppClient
                yield this.dbAppClient.connect();
                // managed pool creation will be automatically triggered
                // by the changed number of connected clients
            }
            catch (err) {
                throw err;
            }
        });
    }
    disconnectDB() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // end setup pgClient and pool
                yield Promise.all([
                    this.dbAppClient.end(),
                    this.dbPoolObj.end()
                ]);
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
    // execute all boot scripts in the boot folder
    executeBootScripts() {
        return __awaiter(this, void 0, void 0, function* () {
            // get all boot files sync
            const files = fastGlob.sync(`${this.ENVIRONMENT.path}/boot/*.{ts,js}`, {
                deep: true,
                onlyFiles: true,
            });
            // sort files
            files.sort();
            // execute all boot scripts
            for (const file of files) {
                // include all boot files sync
                const bootScript = require(file);
                try {
                    bootScript.default != null
                        ? yield bootScript.default(this)
                        : yield bootScript(this);
                    this.logger.trace('boot script successful', file);
                }
                catch (err) {
                    this.logger.warn('boot script error', file, err);
                }
            }
        });
    }
    startServer() {
        return __awaiter(this, void 0, void 0, function* () {
            this.APP = new Koa();
            // start KOA on PORT
            this.server = http.createServer(this.APP.callback()).listen(this.ENVIRONMENT.port);
            // register graceful shutdown - terminus
            this.gracefulShutdown();
            // emit event
            this.emit('server.up', this.ENVIRONMENT.port);
            // success log
            this.logger.info('Server listening on port', this.ENVIRONMENT.port);
        });
    }
    gracefulShutdown() {
        terminus(this.server, {
            // healtcheck options
            healthChecks: {
                // for now we only resolve a promise to make sure the server runs
                '/_health/liveness': () => Promise.resolve(),
                // make sure we are ready to answer requests
                '/_health/readiness': () => getReadyPromise()
            },
            // cleanup options
            timeout: 1000,
            logger: this.logger.info
        });
        // release resources here before node exits
        onExit((exitCode, signal) => __awaiter(this, void 0, void 0, function* () {
            if (signal) {
                this.logger.info('exiting');
                this.logger.info('starting cleanup');
                this.emit('exiting', this.ENVIRONMENT.nodeId);
                try {
                    // close DB connections - has to by synchronous - no await
                    // try to exit as many as possible
                    this.disconnectDB();
                    this.logger.info('shutting down');
                    this.emit('down', this.ENVIRONMENT.nodeId);
                    return true;
                }
                catch (err) {
                    this.logger.warn('Error occurred during clean up attempt', err);
                    this.emit('server.sigterm.error', this.ENVIRONMENT.nodeId, err);
                    throw err;
                }
            }
            return false;
        }));
    }
    // draw CLI art
    cliArt() {
        process.stdout.write('┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n' +
            '├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤ \n' +
            '└  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n');
        process.stdout.write('name: ' + this.ENVIRONMENT.name + '\n');
        process.stdout.write('version: ' + this.ENVIRONMENT.version + '\n');
        process.stdout.write('path: ' + this.ENVIRONMENT.path + '\n');
        process.stdout.write('env: ' + this.ENVIRONMENT.NODE_ENV + '\n');
        process.stdout.write('port: ' + this.ENVIRONMENT.port + '\n');
        process.stdout.write('node id: ' + this.ENVIRONMENT.nodeId + '\n');
        process.stdout.write('____________________________________\n');
    }
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", db_1.DbAppClient)
], FullstackOneCore.prototype, "dbAppClient", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", db_1.DbGeneralPool)
], FullstackOneCore.prototype, "dbPoolObj", void 0);
FullstackOneCore = __decorate([
    typedi_1.Service(),
    __param(0, typedi_1.Inject(type => logger_1.LoggerFactory)),
    __metadata("design:paramtypes", [Object])
], FullstackOneCore);
exports.FullstackOneCore = FullstackOneCore;
// GETTER
// ONE SINGLETON
const $one = typedi_1.Container.get(FullstackOneCore);
function getInstance() {
    return $one;
}
exports.getInstance = getInstance;
// return finished booting promise
function getReadyPromise() {
    return new Promise(($resolve, $reject) => {
        // already booted?
        if ($one.isReady) {
            $resolve($one);
        }
        else {
            // catch ready event
            typedi_1.Container.get(events_1.EventEmitter).on(`${$one.ENVIRONMENT.namespace}.ready`, () => {
                $resolve($one);
            });
            // catch not ready event
            typedi_1.Container.get(events_1.EventEmitter).on(`${$one.ENVIRONMENT.namespace}.not-ready`, (err) => {
                $reject(err);
            });
        }
    });
}
exports.getReadyPromise = getReadyPromise;
// helper to convert an event into a promise
function eventToPromise(pEventName) {
    return new Promise(($resolve, $reject) => {
        typedi_1.Container.get(events_1.EventEmitter).on(pEventName, (...args) => {
            $resolve([...args]);
        });
    });
}
exports.eventToPromise = eventToPromise;
