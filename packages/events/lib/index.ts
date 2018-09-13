import { EventEmitter2 } from 'eventemitter2';
import { Container, Service, Inject } from '@fullstack-one/di';
import { DbAppClient } from '@fullstack-one/db';
import { Config, IEnvironment } from '@fullstack-one/config';
import { BootLoader } from '@fullstack-one/boot-loader';

export interface IEventEmitter {
  emit: (eventName: string, ...args: any[]) =>  void;
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  onAnyInstance: (eventName: string, listener: (...args: any[]) => void) => void;
}

@Service()
export class EventEmitter implements IEventEmitter {

  private config: Config;
  private eventEmitter: EventEmitter2;

  private nodeId: string;
  private dbClient: DbAppClient;
  private namespace: string = 'one';

  // cache during boot
  private listenersCache = {};
  private emittersCache = {};

  constructor(
    @Inject(type => Config) config,
    @Inject(type => BootLoader) bootLoader) {

    this.config = config;

    // register package config
    this.config.addConfigFolder(__dirname + '/../config');

    // finish initialization after ready event => out because ready never gets called due to resolving circular deps
    // this.on(`${this.namespace}.ready`,() => this.finishInitialisation());
    bootLoader.onBootReady(this.boot.bind(this));
  }

  private async boot() {

    const env: IEnvironment = Container.get('ENVIRONMENT');
    this.nodeId = env.nodeId;
    this.namespace = this.config.getConfig('core').namespace;
    this.eventEmitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 100,
      verboseMemoryLeak: true,
    });

    this.dbClient = Container.get(DbAppClient);
    await this.finishInitialisation();

    // set listeners that were cached during booting, clean cache afterwards
    Object.entries(this.listenersCache).forEach((listenerEntry) => {
      const eventName     = listenerEntry[0];
      const eventListeners = listenerEntry[1];
      Object.values(eventListeners).forEach((listener) => {
        this.on(eventName, listener);
      });
    });
    this.listenersCache = {};

    // fire events that were cached during booting, clean cache afterwards
    Object.entries(this.emittersCache).forEach((emitterEntry) => {
      const eventName     = emitterEntry[0];
      const eventEmitters = emitterEntry[1];
      Object.values(eventEmitters).forEach((emitter) => {
        this.emit(eventName, emitter.instanceId, ...emitter.args);
      });
    });
    this.emittersCache = {};
  }

  public emit(eventName: string, ...args: any[]): void {

    // emit on this node
    this._emit(eventName, this.nodeId, ...args);

    // synchronize to other nodes
    this.sendEventToPg(eventName, this.nodeId, ...args);
  }

  public on(eventName: string, listener: (...args: any[]) => void) {
    if (this.eventEmitter != null) {
      const eventNameForThisInstanceOnly = `${this.nodeId}.${eventName}`;
      this.eventEmitter.on(eventNameForThisInstanceOnly, listener);
    } else {
      // cache listeners during booting
      const thisEventListener = this.listenersCache[eventName] = this.listenersCache[eventName] || [];
      thisEventListener.push(listener);
    }

  }

  public onAnyInstance(eventName: string, listener: (...args: any[]) => void) {
    const eventNameForAnyInstance = `*.${eventName}`;
    this.on(eventNameForAnyInstance, listener);
  }

  /* private methods */
  private _emit(eventName: string, instanceId: string, ...args: any[]): void {
    // emit only when emitter is ready
    if (this.eventEmitter != null) {
      const eventNameWithInstanceId = `${instanceId}.${eventName}`;
      this.eventEmitter.emit(eventNameWithInstanceId, instanceId, ...args);
    } else {
      // cache events fired during booting
      const thisEventEmitter = this.emittersCache[eventName] = this.emittersCache[eventName] || [];
      const eventEmitted = {
        instanceId,
        args
      };
      thisEventEmitter.push(eventEmitted);

    }

  }

  private async finishInitialisation() {
    try {
      // catch events from other nodes
      this.dbClient.pgClient.on('notification', (msg: any) => this.receiveEventFromPg(msg));

      this.dbClient.pgClient.query(`LISTEN ${this.namespace}`);

    } catch (err) {
      throw err;
    }
  }

  private sendEventToPg(eventName: string, ...args: any[]) {

    const event = {
      name: eventName,
      instanceId: this.nodeId,
      args: {
        ...args
      }
    };

    // send event to PG (if connection available)
    if (this.dbClient != null) {
      this.dbClient.pgClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
    }
  }

  private receiveEventFromPg(msg) {
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

}
