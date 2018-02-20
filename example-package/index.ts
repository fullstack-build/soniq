import * as One from 'fullstack-one';

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
