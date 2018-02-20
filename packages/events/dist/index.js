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
const ONE = require("fullstack-one");
let EventEmitter = class EventEmitter extends ONE.AbstractPackage {
    constructor() {
        super();
        this.namespace = 'one';
        const env = ONE.Container.get('ENVIRONMENT');
        const config = this.getConfig('config');
        this.nodeId = env.nodeId;
        this.namespace = this.getConfig('core').namespace;
        this.eventEmitter = new eventemitter2_1.EventEmitter2({
            wildcard: true,
            delimiter: '.',
            newListener: false,
            maxListeners: 100,
            verboseMemoryLeak: true,
        });
        // finish initialization after ready event
        this.on(`${this.namespace}.ready`, () => this.finishInitialisation());
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
__decorate([
    ONE.Inject(type => ONE.DbAppClient),
    __metadata("design:type", ONE.DbAppClient)
], EventEmitter.prototype, "dbClient", void 0);
EventEmitter = __decorate([
    ONE.Service(),
    __metadata("design:paramtypes", [])
], EventEmitter);
exports.EventEmitter = EventEmitter;
