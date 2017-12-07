import { EventEmitter2 } from 'eventemitter2';

export interface IEventEmitter {
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  emit: (eventName: string, ...args: any[]) =>  void;

}

class EventEmitter implements IEventEmitter {

  private eventEmitter: EventEmitter2;
  private $one;
  private dbClient;
  private namespace: string = 'f1';

  constructor($one) {
    this.$one = $one;
    this.eventEmitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 100,
      verboseMemoryLeak: true,
    });

    // finish initialization after ready event
    this.eventEmitter.on(`${this.namespace}.${this.$one.getInstanceId()}.ready`,() => this.finishInitialisation());
  }

  public emit(eventName: string, ...args: any[]): void {
    const eventNamespaceName = `${this.namespace}.${this.$one.getInstanceId()}.${eventName}`;

    // emit on this noe
    this._emit(eventNamespaceName, ...args);
    // synchronize to other nodes
    this.sendEventToPg(eventNamespaceName, ...args);
  }

  public on(eventName: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(eventName, listener);
  }

  /* private methods */
  private _emit(eventName: string, ...args: any[]): void {
    this.eventEmitter.emit(eventName, ...args);
  }

  private sendEventToPg(eventName: string, ...args: any[]) {

    const event = {
      name: eventName,
      instanceId: this.$one.getInstanceId(),
      args: {
        ...args
      }
    };

    // send event to PG (if connection available)
    if (this.dbClient != null) {
      this.dbClient.query(`SELECT pg_notify('${this.namespace}', '${JSON.stringify(event)}')`);
    }

  }
  private async finishInitialisation() {
    this.dbClient = this.$one.getDbSetupClient();
    try {
      // catch events from other nodes
      this.dbClient.on('notification', (msg: any) => this.receiveEventFromPg(msg));

      this.dbClient.query(`LISTEN ${this.namespace}`);

    } catch (err) {
      throw err;
    }
  }

  private receiveEventFromPg(msg) {
    // from our namespace
    if (msg.name === 'notification' && msg.channel === this.namespace) {
      const event = JSON.parse(msg.payload);

      // fire on this node if not from same node
      if (event.instanceId !== this.$one.getInstanceId()) {

        const params = [event.name, ...Object.values(event.args)];
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
