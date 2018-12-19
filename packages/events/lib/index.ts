import { EventEmitter2 } from "eventemitter2";
import { Container, Service, Inject } from "@fullstack-one/di";
import { DbAppClient } from "@fullstack-one/db";
import { Config, IEnvironment } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";

export interface IEventEmitter {
  emit: (eventName: string, ...args: any[]) => void;
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  onAnyInstance: (eventName: string, listener: (...args: any[]) => void) => void;
}

interface IEventEmitterOptions {
  once?: boolean;
}

interface IEventEmitterListener {
  eventName: string;
  options: IEventEmitterOptions | null;
  callback?: (nodeId: string, ...args: any[]) => void;
}

interface IEventEmitterListenersCache {
  [eventName: string]: IEventEmitterListener[];
}

interface IEventEmitterEventEmitted {
  nodeId: string;
  args: any;
}

interface IEventEmitterEventEmittedCache {
  [eventName: string]: IEventEmitterEventEmitted[];
}

@Service()
export class EventEmitter implements IEventEmitter {
  private config: Config;
  private readonly CONFIG;
  private eventEmitter: EventEmitter2;

  private readonly THIS_NODE_ID_PLACEHOLDER = "THIS_NODE";
  private nodeId: string;
  private dbClient: DbAppClient;
  private readonly namespace: string = "one";

  // cache during boot
  private listenersCache: IEventEmitterListenersCache = {};
  private emittersCache: IEventEmitterEventEmittedCache = {};

  constructor(@Inject((type) => Config) config, @Inject((type) => BootLoader) bootLoader) {
    this.config = config;

    // register package config
    this.CONFIG = this.config.registerConfig("Events", `${__dirname}/../config`);
    this.namespace = this.CONFIG.namespace;

    bootLoader.onBootReady(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    const env: IEnvironment = Container.get("ENVIRONMENT");
    this.nodeId = env.nodeId;
    this.eventEmitter = new EventEmitter2(this.CONFIG.eventEmitter);

    this.dbClient = Container.get(DbAppClient);
    await this.finishInitialisation();

    // set listeners that were cached during booting, clean cache afterwards
    Object.values(this.listenersCache).forEach((eventListeners) => {
      Object.values(eventListeners).forEach((listener: IEventEmitterListener) => {
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
  }

  /* private methods */
  private async finishInitialisation() {
    try {
      // catch events from other nodes
      this.dbClient.pgClient.on("notification", (msg: any) => this.receiveEventFromPg(msg));

      this.dbClient.pgClient.query(`LISTEN ${this.namespace}`);
    } catch (err) {
      throw err;
    }
  }

  private receiveEventFromPg(msg) {
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

  private _emit(eventName: string, nodeId: string, ...args: any[]): void {
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
    } else {
      // cache events fired during booting
      const thisEventEmitter = (this.emittersCache[eventName] = this.emittersCache[eventName] || []);
      const eventEmitted: IEventEmitterEventEmitted = {
        nodeId,
        args
      };
      thisEventEmitter.push(eventEmitted);
    }
  }

  private sendEventToPg(eventName: string, ...args: any[]) {
    const event = {
      name: eventName,
      nodeId: this.nodeId,
      args: {
        ...args
      }
    };

    // send event to PG (if connection available)
    if (this.dbClient != null) {
      this.dbClient.pgClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
    }
  }

  private _on(eventName: string, options: IEventEmitterOptions | null, callback: (...args: any[]) => void) {
    if (this.eventEmitter != null) {
      // in case nodeId was not available when registering, replace with the actual ID now
      const finalEventName = eventName.replace(this.THIS_NODE_ID_PLACEHOLDER, this.nodeId);
      // register listener on or once?
      if (options == null || options.once !== true) {
        this.eventEmitter.on(finalEventName, callback);
      } else {
        this.eventEmitter.once(finalEventName, callback);
      }
    } else {
      // cache listeners during booting
      const thisEventListener = (this.listenersCache[eventName] = this.listenersCache[eventName] || []);
      const listener: IEventEmitterListener = {
        eventName,
        options,
        callback
      };
      thisEventListener.push(listener);
    }
  }

  public emit(eventName: string, ...args: any[]): void {
    const eventNameWithInstanceId = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
    // emit on this node
    this._emit(eventNameWithInstanceId, this.nodeId, ...args);
  }

  public on(eventName: string, callback: (nodeId: string, ...args: any[]) => void) {
    // of nodeID not available, set THIS_NODE and replace later
    const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
    this._on(eventNameForThisInstanceOnly, null, callback);
  }

  public once(eventName: string, callback: (nodeId: string, ...args: any[]) => void) {
    // of nodeID not available, set THIS_NODE and replace later
    const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
    this._on(eventNameForThisInstanceOnly, { once: true }, callback);
  }

  public removeListener(eventName: string, callback: (nodeId: string, ...args: any[]) => void) {
    // of nodeID not available, set THIS_NODE and replace later
    const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
    this.eventEmitter.removeListener(eventNameForThisInstanceOnly, callback);
  }

  public removeAllListeners(eventName: string) {
    // of nodeID not available, set THIS_NODE and replace later
    const eventNameForThisInstanceOnly = `${this.nodeId || this.THIS_NODE_ID_PLACEHOLDER}.${eventName}`;
    this.eventEmitter.removeAllListeners(eventNameForThisInstanceOnly);
  }

  /*
   *   ON ANY INSTANCE
   *   Will also listen to the events fired on other parallel running nodes
   * */
  public onAnyInstance(eventName: string, callback: (nodeId: string, ...args: any[]) => void) {
    const eventNameForAnyInstance = `*.${eventName}`;
    this._on(eventNameForAnyInstance, null, callback);
  }

  public onceAnyInstance(eventName: string, callback: (nodeId: string, ...args: any[]) => void) {
    const eventNameForAnyInstance = `*.${eventName}`;
    this._on(eventNameForAnyInstance, { once: true }, callback);
  }

  public removeListenerAnyInstance(eventName: string, callback: (nodeId: string, ...args: any[]) => void) {
    const eventNameForAnyInstance = `*.${eventName}`;
    this.eventEmitter.removeListener(eventNameForAnyInstance, callback);
  }

  public removeAllListenersAnyInstance(eventName: string) {
    const eventNameForAnyInstance = `*.${eventName}`;
    this.eventEmitter.removeAllListeners(eventNameForAnyInstance);
  }
}
