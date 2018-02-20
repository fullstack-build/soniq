import { EventEmitter2 } from 'eventemitter2';
import * as ONE from 'fullstack-one';

export interface IEventEmitter {
  emit: (eventName: string, ...args: any[]) =>  void;
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  onAnyInstance: (eventName: string, listener: (...args: any[]) => void) => void;
}

@ONE.Service()
export class EventEmitter extends ONE.AbstractPackage implements IEventEmitter {

  private eventEmitter: EventEmitter2;

  private nodeId: string;
  @ONE.Inject(type => ONE.DbAppClient)
  private dbClient: ONE.DbAppClient;
  private namespace: string = 'one';

  constructor() {
    super();

    const env: ONE.IEnvironment = ONE.Container.get('ENVIRONMENT');
    const config: any = this.getConfig('config');

    this.nodeId = env.nodeId;
    this.namespace = this.getConfig('core').namespace;
    this.eventEmitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 100,
      verboseMemoryLeak: true,
    });

    // finish initialization after ready event
    this.on(`${this.namespace}.ready`,() => this.finishInitialisation());
  }

  public emit(eventName: string, ...args: any[]): void {

    // emit on this node
    this._emit(eventName, this.nodeId, ...args);

    // synchronize to other nodes
    this.sendEventToPg(eventName, this.nodeId, ...args);
  }

  public on(eventName: string, listener: (...args: any[]) => void) {
    const eventNameForThisInstanceOnly = `${this.nodeId}.${eventName}`;
    this.eventEmitter.on(eventNameForThisInstanceOnly, listener);
  }

  public onAnyInstance(eventName: string, listener: (...args: any[]) => void) {
    const eventNameForAnyInstance = `*.${eventName}`;
    this.eventEmitter.on(eventNameForAnyInstance, listener);
  }

  /* private methods */
  private _emit(eventName: string, instanceId: string, ...args: any[]): void {
    const eventNameWithInstanceId = `${instanceId}.${eventName}`;
    this.eventEmitter.emit(eventNameWithInstanceId, instanceId, ...args);
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
