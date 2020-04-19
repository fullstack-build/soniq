import { Logger } from "../index";

type TBootFuntion = (bootLoader?: BootLoader) => void | Promise<void>;

export enum EBootState {
  Initial = "initial",
  Booting = "booting",
  Finished = "finished",
  Failed = "failed",
}

interface IFunctionObject {
  name: string;
  fn: TBootFuntion;
}

type IBootFunctionObject = IFunctionObject;
type IAfterBootFunctionObject = IFunctionObject;

export class BootLoader {
  private readonly _logger: Logger;
  private _state: EBootState = EBootState.Initial;

  private _bootFunctionObjects: IBootFunctionObject[] = [];
  private _afterBootFunctionObjects: IAfterBootFunctionObject[] = [];
  private _failedBootPromiseRejection: Function | undefined;

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

  public addBootFunction(name: string, fn: TBootFuntion): void {
    this._logger.silly("addBootFunction", name);
    this._bootFunctionObjects.push({ name, fn: fn });
  }

  public onBootReady(name: string, fn: TBootFuntion): void | Promise<void> {
    this._logger.silly("onBootReady", name);
    if (this._state === EBootState.Finished) {
      return fn();
    }
    this._afterBootFunctionObjects.push({ name, fn });
  }

  public getReadyPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.onBootReady("BootLoader is ready", () => resolve());
      this._failedBootPromiseRejection = reject;
    });
  }

  public async boot(): Promise<void> {
    this._state = EBootState.Booting;
    this._logger.debug("booting functions starting...");
    try {
      for (const fnObj of this._bootFunctionObjects) {
        this._logger.debug("booting function start: ", fnObj.name);
        await fnObj.fn(this);
        this._logger.debug("booting function end: ", fnObj.name);
      }
      this._logger.debug("... finished booting function.");
      this._state = EBootState.Finished;
      for (const fnObj of this._afterBootFunctionObjects) {
        this._logger.debug("after booting hook function start: ", fnObj.name);
        await fnObj.fn(this);
        this._logger.debug("after booting hook function end: ", fnObj.name);
      }
    } catch (err) {
      this._logger.error("BootLoader caught Error:", err);
      this._state = EBootState.Failed;
      if (this._failedBootPromiseRejection != null) {
        this._failedBootPromiseRejection(err);
      }
      throw err;
    }
  }
}
