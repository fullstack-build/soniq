import * as F1 from '../core';

export class Example extends F1.AbstractPackage {

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
