import * as One from '../core';

export class Example extends One.AbstractPackage {

  constructor() {
    super();

  }

  public async example(): Promise<any> {
    return {
      $one: this.$one,
      CONFIG: this.CONFIG,
      eventEmitter: this.eventEmitter,
      logger: this.logger
    };
  }

}
