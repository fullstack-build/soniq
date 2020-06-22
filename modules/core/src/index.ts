import "reflect-metadata";
const STARTUP_TIME: [number, number] = process.hrtime();

import * as DI from "tsyringe";
import { customAlphabet } from "nanoid";
import { Pool, PoolClient, PoolConfig, QueryResult } from "pg";
import * as Ajv from "ajv";
import { Logger, TLogLevelName } from "tslog";

import { IModuleRuntimeConfig, IModuleAppConfig } from "./interfaces";
import {
  getLatestMigrationVersion,
  ICoreMigration,
  getLatestMigrationVersionPoll,
  ICoreMigrationPoll,
} from "./helpers";
import { Migration } from "./Migration";
import { SoniqApp, SoniqEnvironment } from "./Application";
import { IModuleMigrationResult } from "./Migration/interfaces";
import { EventEmitter } from "events";

export interface IGetModuleRuntimeConfigResult {
  runtimeConfig: IModuleRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetModuleRuntimeConfig = (updateKey?: string) => Promise<IGetModuleRuntimeConfigResult>;
export type TMigrationFunction = (appConfig: IModuleAppConfig, pgClient: PoolClient) => Promise<IModuleMigrationResult>;
export type TBootFunction = (getRuntimeConfig: TGetModuleRuntimeConfig, pgPool: Pool) => Promise<void>;
export type TCreateExtensionConnectorFunction = () => ExtensionConnector;

export interface IExtensionConnector {
  detach: () => void;
}

export class ExtensionConnector {
  public detach(): void {
    return;
  }
}

export interface IModuleCoreFunctions {
  key: string;
  migrate?: TMigrationFunction;
  boot?: TBootFunction;
  createExtensionConnector?: TCreateExtensionConnectorFunction;
}

export * from "./interfaces";
export * from "./Migration/interfaces";
export * from "./Migration/constants";
export * from "./Migration/helpers";
export * from "./Application";
export * from "./Extensions";
export { Pool, PoolClient, PoolConfig, QueryResult, Ajv };

export enum EBootState {
  Initial = "initial",
  Booting = "booting",
  Finished = "finished",
}

export { DI };
export { Logger };

// TODO: move somewhere else later
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

@DI.singleton()
export class Core {
  private readonly _className: string = this.constructor.name;
  private readonly _logger: Logger;
  private _state: EBootState = EBootState.Initial;

  private _modules: IModuleCoreFunctions[] = [];
  private _bootReadyPromiseResolver: ((value?: unknown) => void)[] = [];

  private _runTimePgPool: Pool | undefined;
  private _migration: Migration;

  private _eventEmitter: EventEmitter;

  public constructor() {
    // TODO: catch all errors & exceptions
    this._logger = new Logger({
      instanceName: customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 6)(),
      name: this._className,
      displayInstanceName: true,
    });
    this._migration = new Migration(this._logger, this);
    this._eventEmitter = new EventEmitter();
  }

  public _getModuleCoreFunctionsByKey(key: string): IModuleCoreFunctions | null {
    for (const module of this._modules) {
      if (module.key === key) {
        return module;
      }
    }
    return null;
  }

  public async deployApp(app: SoniqApp, env: SoniqEnvironment): Promise<void> {
    return this._migration.deployApp(app, env);
  }

  private _getModuleRuntimeConfigGetter(moduleKey: string): TGetModuleRuntimeConfig {
    return async () => {
      if (this._runTimePgPool == null) {
        throw new Error("Cannot call getModuleRuntimeConfigGetter when the Pool is not started");
      }

      const pgClient: PoolClient = await this._runTimePgPool.connect();
      try {
        const latestMigration: ICoreMigration = await getLatestMigrationVersion(pgClient);

        if (latestMigration == null) {
          throw new Error("This database has no runtimeConfig.");
        }
        return {
          runtimeConfig: latestMigration.runtimeConfig[moduleKey],
          hasBeenUpdated: true,
        };
      } catch (err) {
        this._logger.error(`core.boot.error.caught: ${err}\n`);
        throw err;
      } finally {
        await pgClient.release();
      }
    };
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

  public addCoreFunctions(moduleCoreFunctions: IModuleCoreFunctions): void {
    this._modules.push(moduleCoreFunctions);
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

  public async boot(pgPoolConfig: PoolConfig): Promise<void> {
    this._logger.info("Booting Application...");
    this._runTimePgPool = new Pool(pgPoolConfig);
    this._state = EBootState.Booting;

    this._startConfigPoller(null).catch(() => {});

    try {
      for (const moduleObject of this._modules) {
        if (moduleObject.boot != null) {
          this._logger.info("Module-boot: Start => ", moduleObject.key);
          await moduleObject.boot(this._getModuleRuntimeConfigGetter(moduleObject.key), this._runTimePgPool);
          this._logger.info("Module-boot: Finished => ", moduleObject.key);
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
      this._logger.info("Soniq Worker running!");
    } catch (err) {
      this._logger.error(`Module-boot failed`, err);
      throw err;
    }
    this._drawCliArt();
  }

  private async _startConfigPoller(lastMigration: ICoreMigrationPoll | null): Promise<void> {
    if (this._runTimePgPool == null) {
      throw new Error("Cannot call getModuleRuntimeConfigGetter when the Pool is not started");
    }

    const pgClient: PoolClient = await this._runTimePgPool.connect();
    try {
      const latestMigration: ICoreMigrationPoll = await getLatestMigrationVersionPoll(pgClient);

      if (latestMigration == null) {
        throw new Error("This database has no runtimeConfig.");
      }

      if (lastMigration != null) {
        if (
          lastMigration.version !== latestMigration.version ||
          lastMigration.id !== latestMigration.id ||
          lastMigration.createdAt.toString() !== latestMigration.createdAt.toString()
        ) {
          // Update
          this._logger.info("New runtimeConfig version detected. Trigger update");
          this._eventEmitter.emit("runtimeConfigUpdate");
        }
      }
      setTimeout(() => {
        this._startConfigPoller(latestMigration).catch(() => {});
      }, 3000);
    } catch (err) {
      this._logger.error(`Config-Poller Error:`, err);
      setTimeout(() => {
        this._startConfigPoller(null).catch(() => {});
      }, 3000);
    } finally {
      await pgClient.release();
    }
  }

  private _drawCliArt(): void {
    process.stdout.write(
      `     
  ___  ___  _ __  _  __ _ 
 / __|/ _ \\| '_ \\| |/ _\` |
 \\__ \\ (_) | | | | | (_| |
 |___/\\___/|_| |_|_|\\__, |
                       | |
                       |_|\n`
    );
    process.stdout.write("____________________________________\n");
    /* process.stdout.write(JSON.stringify({ no: "env" }, undefined, 2) + "\n");
    process.stdout.write("====================================\n"); */
  }

  public getLogger(name?: string, minLevel: TLogLevelName = "silly", exposeStack: boolean = false): Logger {
    return this._logger.getChildLogger({ name, minLevel, exposeStack });
  }

  public getEventEmitter(): EventEmitter {
    return this._eventEmitter;
  }
}
