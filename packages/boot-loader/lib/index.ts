import { Service, Inject } from "@fullstack-one/di";
import { LoggerFactory, Logger } from "@fullstack-one/logger";

type TBootFuntion = (bootLoader?: BootLoader) => void | Promise<void>;

export enum EBootState {
  Initial = "initial",
  Booting = "booting",
  Finished = "finished"
}

interface IFunctionObject {
  name: string;
  fn: TBootFuntion;
}

type IBootFunctionObject = IFunctionObject;
type IAfterBootFunctionObject = IFunctionObject;

@Service()
export class BootLoader {
  private state: EBootState = EBootState.Initial;

  private bootFunctionObjects: IBootFunctionObject[] = [];
  private afterBootFunctionObjects: IAfterBootFunctionObject[] = [];

  public getBootState(): EBootState {
    return this.state;
  }

  public isBooting(): boolean {
    return this.state === EBootState.Booting;
  }

  public hasBooted(): boolean {
    return this.state === EBootState.Finished;
  }

  public addBootFunction(name: string, fn: TBootFuntion): void {
    this.bootFunctionObjects.push({ name, fn });
  }

  public onBootReady(name: string, fn: TBootFuntion): void | Promise<void> {
    if (this.state === EBootState.Finished) {
      return fn();
    }
    this.afterBootFunctionObjects.push({ name, fn });
  }

  public getReadyPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onBootReady("BootLoader.ready", () => resolve());
    });
  }

  public async boot(): Promise<void> {
    this.state = EBootState.Booting;
    try {
      for (const fnObj of this.bootFunctionObjects) {
        await fnObj.fn(this);
      }
      this.state = EBootState.Finished;
      for (const fnObj of this.afterBootFunctionObjects) {
        fnObj.fn(this);
      }
    } catch (err) {
      throw err;
    }
  }
}
