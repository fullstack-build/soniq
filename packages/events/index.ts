import { EventEmitter2 } from 'eventemitter2';

export interface IEventEmitter {
  emit: (eventName: string, ...args: any[]) =>  void;
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  onAnyInstance: (eventName: string, listener: (...args: any[]) => void) => void;
}

class EventEmitter implements IEventEmitter {

  private eventEmitter: EventEmitter2;
  private $one;
  private instanceId: string;
  private dbClient;
  private namespace: string = 'f1';

  constructor($one) {
    this.$one = $one;
    this.instanceId = $one.getNodeId();
    this.namespace = this.$one.getConfig('eventEmitter').namespace;
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
    const eventNamespaceName = `${this.namespace}.${eventName}`;

    // emit on this noe
    this._emit(eventNamespaceName, this.instanceId, ...args);

    // synchronize to other nodes
    this.sendEventToPg(eventNamespaceName, this.instanceId, ...args);
  }

  public on(eventName: string, listener: (...args: any[]) => void) {
    const eventNameForThisInstanceOnly = `${this.instanceId}.${eventName}`;

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
    this.dbClient = await this.$one.getDbSetupClient();
    try {
      // catch events from other nodes
      this.dbClient.on('notification', (msg: any) => this.receiveEventFromPg(msg));

      this.dbClient.query(`LISTEN ${this.namespace}`);

    } catch (err) {
      throw err;
    }
  }

  private sendEventToPg(eventName: string, ...args: any[]) {

    const event = {
      name: eventName,
      instanceId: this.$one.getNodeId(),
      args: {
        ...args
      }
    };

    // send event to PG (if connection available)
    if (this.dbClient != null) {
      this.dbClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
    }

  }

  private receiveEventFromPg(msg) {
    // from our namespace
    if (msg.name === 'notification' && msg.channel === this.namespace) {
      const event = JSON.parse(msg.payload);

      // fire on this node if not from same node
      if (event.instanceId !== this.$one.getNodeId()) {

        const params = [event.name, event.instanceId, ...Object.values(event.args)];
        this._emit.apply(this, params);
      }
    }
  }

}

export namespace Events {

  let eventEmitter: EventEmitter = null;

  export function getEventEmitter($one?) {

    // init if not yet initiated
    eventEmitter = (eventEmitter == null && $one != null) ? (new EventEmitter($one)) : eventEmitter;

    return eventEmitter;

  }

}
