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
        this.THIS_NODE_ID_PLACEHOLDER = "THIS_NODE";
        this.namespace = "one";
        // cache during boot
        this.listenersCache = {};
        this.emittersCache = {};
        this.config = config;
        // register package config
        this.CONFIG = this.config.registerConfig("Events", `${__dirname}/../config`);
        this.namespace = this.CONFIG.namespace;
        bootLoader.onBootReady(this.constructor.name, this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            const env = di_1.Container.get("ENVIRONMENT");
            this.nodeId = env.nodeId;
            this.eventEmitter = new eventemitter2_1.EventEmitter2(this.CONFIG.eventEmitter);
            this.dbClient = di_1.Container.get(db_1.DbAppClient);
            yield this.finishInitialisation();
            // set listeners that were cached during booting, clean cache afterwards
            Object.values(this.listenersCache).forEach((eventListeners) => {
                Object.values(eventListeners).forEach((listener) => {
                    this._on(listener.eventName, listener.options, listener.callback);
                });
            });
            this.listenersCache = {};
            // fire events that were cached during booting, clean cache afterwards
            Object.entries(this.emittersCache).forEach((emitterEntry) => {
                const eventName = emitterEntry[0];
                const eventEmitters = emitterEntry[1];
                Object.values(eventEmitters).forEach((emitter) => {
                    this._emit(eventName, emitter.nodeId, ...emitter.args);
                });
            });
            this.emittersCache = {};
        });
    }
    /* private methods */
    finishInitialisation() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // catch events from other nodes
                this.dbClient.pgClient.on("notification", (msg) => this.receiveEventFromPg(msg));
                this.dbClient.pgClient.query(`LISTEN ${this.namespace}`);
            }
            catch (err) {
                throw err;
            }
        });
    }
    receiveEventFromPg(msg) {
        // from our namespace
        if (msg.name === "notification" && msg.channel === this.namespace) {
            const event = JSON.parse(msg.payload);
            // fire on this node if not from same node
            if (event.nodeId !== this.nodeId) {
                const params = [event.name, ...Object.values(event.args)];
                this._emit.apply(this, params);
            }
        }
    }
    _emit(eventName, nodeId, ...args) {
        // emit only when emitter is ready
        if (this.eventEmitter != null) {
            // in case nodeId was not available when registering, replace with the actual ID now
            const finalEventName = eventName.replace(this.THIS_NODE_ID_PLACEHOLDER, this.nodeId);
            const finalNode = nodeId || this.nodeId;
            this.eventEmitter.emit(finalEventName, finalNode, ...args);
            // synchronize own events to other nodes
            if (this.nodeId === finalNode) {
                this.sendEventToPg(finalEventName, this.nodeId, ...args);
            }
        }
        else {
            // cache events fired during booting
            const thisEventEmitter = (this.emittersCache[eventName] = this.emittersCache[eventName] || []);
            const eventEmitted = {
                nodeId,
                args
            };
            thisEventEmitter.push(eventEmitted);
        }
    }
    sendEventToPg(eventName, ...args) {
        const event = {
            name: eventName,
            nodeId: this.nodeId,
            args: Object.assign({}, args)
        };
        // send event to PG (if connection available)
        if (this.dbClient != null) {
            this.dbClient.pgClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
        }
    }
    _on(eventName, options, callback) {
        if (this.eventEmitter != null) {
            // in case nodeId was not available when registering, replace with the actual ID now
            const finalEventName = eventName.replace(this.THIS_NODE_ID_PLACEHOLDER, this.nodeId);
            // register listener on or once?
            if (options == null || options.once !== true) {
                this.eventEmitter.on(finalEventName, callback);
            }
            else {
                this.eventEmitter.once(finalEventName, callback);
            }
        }
        else {
            // cache listeners during booting
            const thisEventListener = (this.listenersCache[eventName] = this.listenersCache[eventName] || []);
            const listener = {
                eventName,
                options,
                callback
            };
            thisEventListener.push(listener);
        }
    }
    emit(eventName, ...args) {
        const eventNameWithInstanceId = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
        // emit on this node
        this._emit(eventNameWithInstanceId, this.nodeId, ...args);
    }
    on(eventName, callback) {
        // of nodeID not available, set THIS_NODE and replace later
        const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
        this._on(eventNameForThisInstanceOnly, null, callback);
    }
    once(eventName, callback) {
        // of nodeID not available, set THIS_NODE and replace later
        const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
        this._on(eventNameForThisInstanceOnly, { once: true }, callback);
    }
    removeListener(eventName, callback) {
        // of nodeID not available, set THIS_NODE and replace later
        const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
        this.eventEmitter.removeListener(eventNameForThisInstanceOnly, callback);
    }
    removeAllListeners(eventName) {
        // of nodeID not available, set THIS_NODE and replace later
        const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
        this.eventEmitter.removeAllListeners(eventNameForThisInstanceOnly);
    }
    /*
     *   ON ANY INSTANCE
     *   Will also listen to the events fired on other parallel running nodes
     * */
    onAnyInstance(eventName, callback) {
        const eventNameForAnyInstance = `*.${eventName}`;
        this._on(eventNameForAnyInstance, null, callback);
    }
    onceAnyInstance(eventName, callback) {
        const eventNameForAnyInstance = `*.${eventName}`;
        this._on(eventNameForAnyInstance, { once: true }, callback);
    }
    removeListenerAnyInstance(eventName, callback) {
        const eventNameForAnyInstance = `*.${eventName}`;
        this.eventEmitter.removeListener(eventNameForAnyInstance, callback);
    }
    removeAllListenersAnyInstance(eventName) {
        const eventNameForAnyInstance = `*.${eventName}`;
        this.eventEmitter.removeAllListeners(eventNameForAnyInstance);
    }
};
EventEmitter = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => config_1.Config)), __param(1, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __metadata("design:paramtypes", [Object, Object])
], EventEmitter);
exports.EventEmitter = EventEmitter;
