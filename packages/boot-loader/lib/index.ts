import { Service } from "@fullstack-one/di";

@Service()
export class BootLoader {
  private IS_BOOTING: boolean = false;
  private HAS_BOOTED: boolean = false;

  private bootFunctions: any = [];
  private bootReadyFunctions: any = [];

  public isBooting(): boolean {
    return this.IS_BOOTING;
  }

  public hasBooted(): boolean {
    return this.HAS_BOOTED;
  }

  public addBootFunction(fn: any) {
    this.bootFunctions.push(fn);
  }

  public onBootReady(fn: any) {
    if (this.HAS_BOOTED) {
      return fn();
    }
    this.bootReadyFunctions.push(fn);
  }

  public getReadyPromise() {
    return new Promise((resolve, reject) => {
      if (this.HAS_BOOTED) {
        return resolve();
      }
      this.bootReadyFunctions.push(resolve);
    });
  }

  public async boot() {
    this.IS_BOOTING = true;
    for (const fn of this.bootFunctions) {
      await fn(this);
    }
    for (const fn of this.bootReadyFunctions) {
      fn(this);
    }
    this.IS_BOOTING = false;
    this.HAS_BOOTED = true;
  }
}
