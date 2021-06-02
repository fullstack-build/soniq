import "reflect-metadata";
const STARTUP_TIME: [number, number] = process.hrtime();

import * as DI from "tsyringe";
import { customAlphabet } from "nanoid";
import { Pool, PoolClient, PoolConfig, QueryResult } from "pg";
import * as Ajv from "ajv";
import { Logger, TLogLevelName } from "tslog";

import { IModuleRunConfig, IModuleAppConfig, IApplicationConfig, IAppConfig } from "./moduleDefinition/interfaces";
import { drawCliArt, ICoreMigration } from "./helpers";
import { Migration } from "./migration";
import { IModuleMigrationResult, IObjectTrace } from "./migration/interfaces";
import { EventEmitter } from "events";

export type TShouldMigrateFunction = () => string;
export type TMigrationFunction = (pgClient: PoolClient) => Promise<IModuleMigrationResult>;
export type TBootFunction = (moduleRunConfig: IModuleRunConfig, pgPool: Pool) => Promise<void>;

export type IModule =
  | {
      key: string;
      shouldMigrate?: never;
      migrate?: never;
      boot?: TBootFunction;
    }
  | {
      key: string;
      shouldMigrate: TShouldMigrateFunction;
      migrate: TMigrationFunction;
      boot?: TBootFunction;
    };

/*export interface IModule {
  key: string;
  shouldMigrate?: TShouldMigrateFunction;
  migrate?: TMigrationFunction;
  boot?: TBootFunction;
}*/

export * from "./moduleDefinition/interfaces";
export * from "./migration/interfaces";
export * from "./migration/constants";
export * from "./migration/helpers";
export * from "./moduleDefinition";
export { Pool, PoolClient, PoolConfig, QueryResult, Ajv };

export enum EBootState {
  Initial = "initial",
  Booting = "booting",
  Finished = "finished",
}

export { DI };
export { Logger };

const rootLogger: Logger = new Logger();

// TODO: move somewhere else later
process.on("unhandledRejection", (reason) => {
  try {
    rootLogger.fatal("UNHANDLED REJECTION:", reason);
  } catch (e) {
    console.error("UNHANDLED REJECTION:", reason);
  }
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Asynchronous error caught.", err);
  try {
    rootLogger.fatal("UNCAUGHT EXCEPTION:", err);
  } catch (e) {
    console.error("UNCAUGHT EXCEPTION:", err);
  }
  process.exit(1);
});

@DI.singleton()
export class Core {
  private readonly _className: string = this.constructor.name;
  private readonly _logger: Logger;
  private _state: EBootState = EBootState.Initial;

  private _modules: IModule[] = [];
  private _bootReadyPromiseResolver: ((value?: unknown) => void)[] = [];

  private _pgPool: Pool | undefined;
  private _runTimeCoreMigration: ICoreMigration | undefined;
  private _migration: Migration;

  private _eventEmitter: EventEmitter;

  private _appConfig: IAppConfig;
  private _objectTraces: IObjectTrace[];

  public constructor(@DI.inject("ApplicationConfig") applicationConfig: IApplicationConfig) {
    this._appConfig = applicationConfig.appConfig;
    this._objectTraces = applicationConfig.objectTraces;

    // TODO: catch all errors & exceptions
    this._logger = new Logger({
      instanceName: customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 6)(),
      name: this._className,
      displayInstanceName: true,
    });
    this._migration = new Migration(this._logger, this);
    this._eventEmitter = new EventEmitter();

    this.initModule({ key: this.constructor.name });
  }

  public _getModuleCoreFunctionsByKey(key: string): IModule | null {
    for (const module of this._modules) {
      if (module.key === key) {
        return module;
      }
    }
    return null;
  }

  public async bootApp(pgPoolConfig: PoolConfig, disableAutoMigration: boolean): Promise<void> {
    this._logger.info("Starting Application");
    try {
      this._pgPool = new Pool(pgPoolConfig);
      await this._pgPool.query("SELECT TRUE;");
    } catch (err) {
      this._logger.fatal("Failed to connect to database", err);
      throw err;
    }

    this._runTimeCoreMigration = await this._migration.migrateApp(
      this._appConfig,
      this._objectTraces,
      this._pgPool,
      disableAutoMigration
    );

    await this.bootModules();

    return;
  }

  /* public async migrateApp(app: SoniqApp, env: SoniqEnvironment): Promise<void> {
    return this._migration.migrateApp(app, env);
  }*/

  public getBootState(): EBootState {
    return this._state;
  }

  public isBooting(): boolean {
    return this._state === EBootState.Booting;
  }

  public hasBooted(): boolean {
    return this._state === EBootState.Finished;
  }

  public initModule(module: IModule): IModuleAppConfig {
    for (const existingModule of this._modules) {
      if (existingModule.key === module.key) {
        throw new Error(`A module with key ${module.key} has already been initialised.`);
      }
    }
    for (const moduleConfig of this._appConfig.modules) {
      if (moduleConfig.key === module.key) {
        this._modules.push(module);
        return moduleConfig.appConfig;
      }
    }

    throw new Error(`Could not find config for module ${module.key}.`);
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

  public async bootModules(): Promise<void> {
    this._logger.info("Booting Modules");

    if (this._runTimeCoreMigration == null) {
      throw new Error("_runTimeCoreMigration must be set before boot");
    }
    if (this._pgPool == null) {
      throw new Error("_pgPool must be set before boot");
    }

    this._state = EBootState.Booting;

    const latestMigration: ICoreMigration = this._runTimeCoreMigration;

    try {
      for (const module of this._modules) {
        if (module.boot != null && latestMigration.runConfig[module.key] != null) {
          this._logger.info("Module-boot: Start => ", module.key);
          await module.boot(latestMigration.runConfig[module.key], this._pgPool);
          this._logger.info("Module-boot: Finished => ", module.key);
        }
      }
      this._state = EBootState.Finished;

      this._logger.info("Finished Module-boot", `Took ${process.hrtime(STARTUP_TIME)} seconds.`);

      for (const resolverFunction of this._bootReadyPromiseResolver) {
        try {
          resolverFunction();
        } catch (err) {
          // Ignore Errors because this is only an Event
        }
      }
      this._logger.info("Soniq application running!");
    } catch (err) {
      this._logger.fatal(`Module-boot failed`, err);
      throw err;
    }
    drawCliArt();
  }

  public getLogger(name?: string, minLevel: TLogLevelName = "silly", exposeStack: boolean = false): Logger {
    return this._logger.getChildLogger({ name, minLevel, exposeStack });
  }

  public getEventEmitter(): EventEmitter {
    return this._eventEmitter;
  }

  public getPgPool(): Pool {
    if (this._pgPool == null || this._state !== EBootState.Finished) {
      throw new Error("You cannot get a pool before boot is finished.");
    }
    return this._pgPool;
  }
}
