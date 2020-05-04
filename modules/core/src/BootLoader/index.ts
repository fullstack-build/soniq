const STARTUP_TIME: [number, number] = process.hrtime();
import { Service, Logger } from "../index";

export type TBootFuntion = () => // getRuntimeConfig: TGetModuleRuntimeConfig,
// pgPool: Pool
Promise<void>;

interface IModuleCoreFunctions {
  key: string;
  //migrate?: TMigrationFunction;
  boot?: TBootFuntion;
}

export enum EBootState {
  Initial = "initial",
  Booting = "booting",
  Finished = "finished",
}

@Service()
export class BootLoader {
  private readonly _logger: Logger;
  private _state: EBootState = EBootState.Initial;

  private _modules: IModuleCoreFunctions[] = [];
  private _bootReadyPromiseResolver: ((value?: unknown) => void)[] = [];

  public constructor(logger: Logger) {
    this._logger = logger;
  }

  public getBootState(): EBootState {
    return this._state;
  }

  public isBooting(): boolean {
    return this._state === EBootState.Booting;
  }

  public hasBooted(): boolean {
    return this._state === EBootState.Finished;
  }

  public hasBootedPromise(): Promise<unknown> | true {
    if (this.hasBooted()) {
      return true;
    } else {
      return new Promise((resolve) => {
        this._bootReadyPromiseResolver.push(resolve);
      });
    }
  }

  public async boot(): Promise<void> {
    this._logger.info("core.boot.start");
    this._state = EBootState.Booting;

    try {
      for (const moduleObject of this._modules) {
        if (moduleObject.boot != null) {
          this._logger.info("core.boot.module.start", moduleObject.key);
          await moduleObject
            .boot
            // this.getModuleRuntimeConfigGetter(moduleObject.key),
            // this.runTimePgPool
            ();
          this._logger.info("core.boot.module.ready", moduleObject.key);
        }
      }
      this._state = EBootState.Finished;

      this._logger.info(
        "core.boot.ready",
        `It took ${process.hrtime(STARTUP_TIME)} seconds.`
      );

      for (const resolverFunction of this._bootReadyPromiseResolver) {
        try {
          resolverFunction();
        } catch {
          // Ignore Errors because this is only an Event
        }
      }
    } catch (err) {
      this._logger.error("core.boot.error.caught", err);
      throw err;
    }
  }
}
