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
    constructor(c, bootLoader) {
        this.namespace = 'one';
        const env = di_1.Container.get('ENVIRONMENT');
        const config = c.getConfig('config');
        const coreConfig = c.getConfig('core');
        this.nodeId = env.nodeId;
        this.namespace = c.getConfig('core').namespace;
        this.eventEmitter = new eventemitter2_1.EventEmitter2({
            wildcard: true,
            delimiter: '.',
            newListener: false,
            maxListeners: 100,
            verboseMemoryLeak: true,
        });
        // finish initialization after ready event => out because ready never gets called due to resolving circular deps
        // this.on(`${this.namespace}.ready`,() => this.finishInitialisation());
        bootLoader.onBootReady(this.boot.bind(this));
    }
    emit(eventName, ...args) {
        // emit on this node
        this._emit(eventName, this.nodeId, ...args);
        // synchronize to other nodes
        this.sendEventToPg(eventName, this.nodeId, ...args);
    }
    on(eventName, listener) {
        const eventNameForThisInstanceOnly = `${this.nodeId}.${eventName}`;
        this.eventEmitter.on(eventNameForThisInstanceOnly, listener);
    }
    onAnyInstance(eventName, listener) {
        const eventNameForAnyInstance = `*.${eventName}`;
        this.eventEmitter.on(eventNameForAnyInstance, listener);
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dbClient = di_1.Container.get(db_1.DbAppClient);
            yield this.finishInitialisation();
        });
    }
    /* private methods */
    _emit(eventName, instanceId, ...args) {
        const eventNameWithInstanceId = `${instanceId}.${eventName}`;
        this.eventEmitter.emit(eventNameWithInstanceId, instanceId, ...args);
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
