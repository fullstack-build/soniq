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

  private readonly logger: Logger;

  constructor(@Inject((type) => LoggerFactory) loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(this.constructor.name);
  }

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
    this.logger.debug("addBootFunction", name);
    this.bootFunctionObjects.push({ name, fn });
  }

  public onBootReady(name: string, fn: TBootFuntion): void | Promise<void> {
    this.logger.debug("onBootReady", name);
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
        this.logger.debug("boot.bootFunctions.start", fnObj.name);
        await fnObj.fn(this);
        this.logger.debug("boot.bootFunctions.end", fnObj.name);
      }
      this.state = EBootState.Finished;
      for (const fnObj of this.afterBootFunctionObjects) {
        this.logger.debug("boot.afterBootFunctions.start", fnObj.name);
        fnObj.fn(this);
        this.logger.debug("boot.afterBootFunctions.start", fnObj.name);
      }
    } catch (err) {
      this.logger.error(`BootLoader.boot.error.caught: ${err}\n`);
      throw err;
    }
  }
}
