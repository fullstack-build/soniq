import { Service, Inject } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";

type TBootFuntion = (bootLoader?: BootLoader) => void | Promise<void>;

interface IBootFunctionObject {
  name: string;
  fn: TBootFuntion;
}

@Service()
export class BootLoader {
  private IS_BOOTING: boolean = false; // TODO: Dustin Rename
  private HAS_BOOTED: boolean = false; // TODO: Dustin Rename

  private bootFunctionObjects: IBootFunctionObject[] = [];
  private bootReadyFunctionObjects: IBootFunctionObject[] = [];

  private readonly logger: ILogger;

  constructor(@Inject((type) => LoggerFactory) loggerFactory) {
    // init logger
    this.logger = loggerFactory.create(this.constructor.name);
  }

  public isBooting(): boolean {
    return this.IS_BOOTING;
  }

  public hasBooted(): boolean {
    return this.HAS_BOOTED;
  }

  public addBootFunction(name: string, fn: TBootFuntion): void {
    this.logger.trace("addBootFunction", name);
    this.bootFunctionObjects.push({ name, fn });
  }

  public onBootReady(name: string, fn: TBootFuntion): void | Promise<void> {
    this.logger.trace("onBootReady", name);
    if (this.HAS_BOOTED) {
      return fn();
    }
    this.bootReadyFunctionObjects.push({ name, fn });
  }

  public getReadyPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.HAS_BOOTED) {
        return resolve();
      }
      this.bootReadyFunctionObjects.push({ name: "BootLoader.ready", fn: () => resolve() });
    });
  }

  public async boot(): Promise<void> {
    this.IS_BOOTING = true;
    try {
      for (const fnObj of this.bootFunctionObjects) {
        this.logger.trace("boot.bootFunctions.start", fnObj.name);
        await fnObj.fn(this);
        this.logger.trace("boot.bootFunctions.end", fnObj.name);
      }
      for (const fnObj of this.bootReadyFunctionObjects) {
        this.logger.trace("boot.bootReadyFunctions.start", fnObj.name);
        fnObj.fn(this);
        this.logger.trace("boot.bootReadyFunctions.start", fnObj.name);
      }
      this.IS_BOOTING = false;
      this.HAS_BOOTED = true;
    } catch (err) {
      process.stderr.write(`BootLoader.boot.error.caught: ${err}\n`);
      throw err;
    }
  }
}
