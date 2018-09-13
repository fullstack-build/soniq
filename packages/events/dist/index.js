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
const eventemitter2_1 = require("eventemitter2");
const di_1 = require("@fullstack-one/di");
const db_1 = require("@fullstack-one/db");
const config_1 = require("@fullstack-one/config");
const boot_loader_1 = require("@fullstack-one/boot-loader");
let EventEmitter = class EventEmitter {
    constructor(config, bootLoader) {
        this.namespace = 'one';
        // cache during boot
        this.listenersCache = {};
        this.emittersCache = {};
        this.config = config;
        // register package config
        this.config.addConfigFolder(__dirname + '/../config');
        // finish initialization after ready event => out because ready never gets called due to resolving circular deps
        // this.on(`${this.namespace}.ready`,() => this.finishInitialisation());
        bootLoader.onBootReady(this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            const env = di_1.Container.get('ENVIRONMENT');
            this.nodeId = env.nodeId;
            this.namespace = this.config.getConfig('core').namespace;
            this.eventEmitter = new eventemitter2_1.EventEmitter2({
                wildcard: true,
                delimiter: '.',
                newListener: false,
                maxListeners: 100,
                verboseMemoryLeak: true,
            });
            this.dbClient = di_1.Container.get(db_1.DbAppClient);
            yield this.finishInitialisation();
            // set listeners that were cached during booting
            Object.entries(this.listenersCache).forEach((listenerEntry) => {
                const eventName = listenerEntry[0];
                const eventListeners = listenerEntry[1];
                Object.values(eventListeners).forEach((listener) => {
                    this.on(eventName, listener);
                });
            });
            // fire events that were cached during booting
            Object.entries(this.emittersCache).forEach((emitterEntry) => {
                const eventName = emitterEntry[0];
                const eventEmitters = emitterEntry[1];
                Object.values(eventEmitters).forEach((emitter) => {
                    this.emit(eventName, emitter.instanceId, ...emitter.args);
                });
            });
        });
    }
    emit(eventName, ...args) {
        // emit on this node
        this._emit(eventName, this.nodeId, ...args);
        // synchronize to other nodes
        this.sendEventToPg(eventName, this.nodeId, ...args);
    }
    on(eventName, listener) {
        if (this.eventEmitter != null) {
            const eventNameForThisInstanceOnly = `${this.nodeId}.${eventName}`;
            this.eventEmitter.on(eventNameForThisInstanceOnly, listener);
        }
        else {
            // cache listeners during booting
            const thisEventListener = this.listenersCache[eventName] = this.listenersCache[eventName] || [];
            thisEventListener.push(listener);
        }
    }
    onAnyInstance(eventName, listener) {
        const eventNameForAnyInstance = `*.${eventName}`;
        this.on(eventNameForAnyInstance, listener);
    }
    /* private methods */
    _emit(eventName, instanceId, ...args) {
        // emit only when emitter is ready
        if (this.eventEmitter != null) {
            const eventNameWithInstanceId = `${instanceId}.${eventName}`;
            this.eventEmitter.emit(eventNameWithInstanceId, instanceId, ...args);
        }
        else {
            // cache events fired during booting
            const thisEventEmitter = this.emittersCache[eventName] = this.emittersCache[eventName] || [];
            const eventEmitted = {
                instanceId,
                args
            };
            thisEventEmitter.push(eventEmitted);
        }
    }
    finishInitialisation() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // catch events from other nodes
                this.dbClient.pgClient.on('notification', (msg) => this.receiveEventFromPg(msg));
                this.dbClient.pgClient.query(`LISTEN ${this.namespace}`);
            }
            catch (err) {
                throw err;
            }
        });
    }
    sendEventToPg(eventName, ...args) {
        const event = {
            name: eventName,
            instanceId: this.nodeId,
            args: Object.assign({}, args)
        };
        // send event to PG (if connection available)
        if (this.dbClient != null) {
            this.dbClient.pgClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
        }
    }
    receiveEventFromPg(msg) {
        // from our namespace
        if (msg.name === 'notification' && msg.channel === this.namespace) {
            const event = JSON.parse(msg.payload);
            // fire on this node if not from same node
            if (event.instanceId !== this.nodeId) {
                const params = [event.name, event.instanceId, ...Object.values(event.args)];
                this._emit.apply(this, params);
            }
        }
    }
};
EventEmitter = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => config_1.Config)),
    __param(1, di_1.Inject(type => boot_loader_1.BootLoader)),
    __metadata("design:paramtypes", [Object, Object])
], EventEmitter);
exports.EventEmitter = EventEmitter;
