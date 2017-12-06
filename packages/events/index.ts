import { EventEmitter2 } from 'eventemitter2';
export { EventEmitter2 } from 'eventemitter2';

export class Events {

  private eventEmitter: EventEmitter2;
  private $one;

  constructor($one) {
    this.$one = $one;
    this.eventEmitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 100,
      verboseMemoryLeak: true,
    });
  }

  public getEventEmitter(): EventEmitter2 {
    return this.eventEmitter;
  }

  public emit = (eventName: string, ...args: any[]): void => {
    this.eventEmitter.emit(`fullstack-one.${this.$one.getInstanceId()}.${eventName}`, ...args);
  }

}
