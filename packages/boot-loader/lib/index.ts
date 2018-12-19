import { Service, Inject } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";

interface IBootFunction {
  name: string;
  fn: any;
}

@Service()
export class BootLoader {
  private IS_BOOTING: boolean = false; // TODO: Dustin Rename
  private HAS_BOOTED: boolean = false; // TODO: Dustin Rename

  private bootFunctions: IBootFunction[] = [];
  private bootReadyFunctions: IBootFunction[] = [];

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

  public addBootFunction(name: string, fn: any) {
    this.logger.trace("addBootFunction", name);
    this.bootFunctions.push({ name, fn });
  }

  public onBootReady(name: string, fn: any) {
    this.logger.trace("onBootReady", name);
    if (this.HAS_BOOTED) {
      return fn();
    }
    this.bootReadyFunctions.push({ name, fn });
  }

  public getReadyPromise() {
    return new Promise((resolve, reject) => {
      if (this.HAS_BOOTED) {
        return resolve();
      }
      this.bootReadyFunctions.push({ name: "BoorLoader.ready", fn: resolve });
    });
  }

  public async boot() {
    this.IS_BOOTING = true;
    try {
      for (const fnObj of this.bootFunctions) {
        this.logger.trace("boot.bootFunctions.start", fnObj.name);
        await fnObj.fn(this);
        this.logger.trace("boot.bootFunctions.end", fnObj.name);
      }
      for (const fnObj of this.bootReadyFunctions) {
        this.logger.trace("boot.bootReadyFunctions.start", fnObj.name);
        fnObj.fn(this);
        this.logger.trace("boot.bootReadyFunctions.start", fnObj.name);
      }
      this.IS_BOOTING = false;
      this.HAS_BOOTED = true;
    } catch (err) {
      process.stderr.write("BootLoader.boot.error.caught\n");
      process.stderr.write(`${err}`);
      process.exit(0);
    }
  }
}
