import { EventEmitter2 } from 'eventemitter2';

export interface IEventEmitter {
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  emit: (eventName: string, ...args: any[]) =>  void;
  internalEmit: (eventName: string, ...args: any[]) =>  void;

}

class EventEmitter implements IEventEmitter {

  private eventEmitter: EventEmitter2;
  private $one;
  private dbClient;

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
    this.eventEmitter.on(`fullstack-one.${this.$one.getInstanceId()}.ready`,() => this.finishInitialisation());
  }

  public emit(eventName: string, ...args: any[]): void {
    this.eventEmitter.emit(eventName, ...args);
  }

  public internalEmit(eventName: string, ...args: any[]): void {
    this.emit(`f1.${this.$one.getInstanceId()}.${eventName}`, ...args);
  }

  public on(eventName: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(eventName, listener);
  }

  /* private methods */
  private async finishInitialisation() {
    this.dbClient = this.$one.getDbSetupClient();
    try {

      this.dbClient.on('notification', (msg) => {
        // if (msg.name === 'notification' && msg.channel === 'table_update') {

        // console.error('*****', msg);
        /*var pl = JSON.parse(msg.payload);
				console.log("*========*");
				Object.keys(pl).forEach(function (key) {
					console.log(key, pl[key]);
				});
				console.log("-========-");
			}*/
      });
      this.dbClient.query('LISTEN table_update');

      const res2 = await this.dbClient.query('INSERT INTO users ("name") VALUES(\'123\')');
      // console.error('*2', res2);

    } catch (err) {
      // console.error(err);
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
