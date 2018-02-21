
import { Service } from '@fullstack-one/di';

@Service()
export class BootLoader {
  private bootFunctions: any = [];
  private bootReadyFunctions: any = [];
  private hasBooted: boolean = false;

  public addBootFunction(fn: any) {
    this.bootFunctions.push(fn);
  }

  public getReadyPromise() {
    return new Promise((resolve, reject) => {
      if (this.hasBooted) {
        return resolve();
      }
      this.bootReadyFunctions.push(resolve);
    });
  }

  public async boot() {
    for (const fn of this.bootFunctions) {
      await fn(this);
    }
    for (const fn of this.bootReadyFunctions) {
      fn(this);
    }
  }
}
