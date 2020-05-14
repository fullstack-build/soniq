/* eslint-disable require-atomic-updates */
import "reflect-metadata";
const STARTUP_TIME: [number, number] = process.hrtime();
// DI
import { Service, Container, ContainerInstance, Inject, InjectMany } from "typedi";

import {
  IModuleRuntimeConfig,
  IModuleEnvConfig,
  IModuleAppConfig,
  IMigrationResult,
  IAppConfig,
  IModuleConfig,
  IMigrationResultWithFixes,
  ICommand,
  OPERATION_SORT_POSITION,
  IModuleMigrationResult,
} from "./interfaces";

import { Pool, PoolClient, PoolConfig, QueryResult } from "pg";
import {
  asyncForEach,
  getSchemas,
  getPgSelector,
  applyAutoAppConfigFixes,
  getTables,
  castMigrationResult,
  getExtensions,
  getLatestMigrationVersion,
  ICoreMigration,
} from "./helpers";

import * as Ajv from "ajv";

export interface IGetModuleRuntimeConfigResult {
  runtimeConfig: IModuleRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetModuleRuntimeConfig = (updateKey?: string) => Promise<IGetModuleRuntimeConfigResult>;
export type TMigrationFuntion = (
  appConfig: IModuleAppConfig,
  envConfig: IModuleEnvConfig,
  pgClient: PoolClient
) => Promise<IModuleMigrationResult>;
export type TBootFuntion = (getRuntimeConfig: TGetModuleRuntimeConfig, pgPool: Pool) => Promise<void>;

interface IModuleCoreFunctions {
  key: string;
  migrate?: TMigrationFuntion;
  boot?: TBootFuntion;
}

export * from "./interfaces";
export * from "./helpers";
export * from "./ConfigManager";
export { Pool, PoolClient, PoolConfig, QueryResult, Ajv };

export enum EBootState {
  Initial = "initial",
  Booting = "booting",
  Finished = "finished",
}

export { Service, Container, ContainerInstance, Inject, InjectMany };
import { Logger, TLogLevelName } from "tslog";
export { Logger };

// TODO: move somewhere else later
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

@Service()
export class Core {
  private readonly _className: string = this.constructor.name;
  private readonly _logger: Logger;
  private _state: EBootState = EBootState.Initial;

  private _modules: IModuleCoreFunctions[] = [];
  // tslint:disable-next-line:array-type
  private _bootReadyPromiseResolver: ((value?: unknown) => void)[] = [];

  private _runTimePgPool: Pool | undefined;

  public constructor() {
    // TODO: catch all errors & exceptions
    this._logger = new Logger({
      instanceName: "", // TODO: Set instance-name
      name: this._className,
      displayInstanceName: true,
    });
  }

  private async _generateModuleMigrations(
    version: string,
    appConfig: IAppConfig,
    envKey: string,
    pgClient: PoolClient
  ): Promise<IMigrationResult> {
    const result: IMigrationResult = {
      runtimeConfig: {},
      errors: [],
      warnings: [],
      commands: [],
    };

    await asyncForEach(appConfig.modules, async (moduleConfig: IModuleConfig) => {
      const moduleCoreFunctions: IModuleCoreFunctions | null = this._getModuleCoreFunctionsByKey(moduleConfig.key);

      if (moduleCoreFunctions == null) {
        result.errors.push({
          message: `The module with key '${moduleConfig.key}' does not exist on this system.`,
        });
      } else {
        const moduleEnvConfig: unknown = moduleConfig.envConfig[envKey] || {};

        if (moduleCoreFunctions.migrate != null) {
          const moduleMigrationResult: IModuleMigrationResult = await moduleCoreFunctions.migrate(
            moduleConfig.appConfig,
            moduleEnvConfig,
            pgClient
          );

          if (moduleMigrationResult != null) {
            result.runtimeConfig[moduleConfig.key] = moduleMigrationResult.moduleRuntimeConfig;

            moduleMigrationResult.errors.forEach((error) => {
              error.moduleKey = moduleConfig.key;
              result.errors.push(error);
            });
            moduleMigrationResult.warnings.forEach((warning) => {
              warning.moduleKey = moduleConfig.key;
              result.warnings.push(warning);
            });
            moduleMigrationResult.commands.forEach((command) => {
              command.moduleKey = moduleConfig.key;
              result.commands.push(command);
            });
          }
        }
      }
    });

    const finalResult: IMigrationResult = await this._generateCoreMigrations(
      version,
      appConfig,
      envKey,
      pgClient,
      result
    );

    finalResult.commands = result.commands.sort((a, b) => {
      return a.operationSortPosition - b.operationSortPosition;
    });

    return finalResult;
  }

  private async _generateCoreMigrations(
    version: string,
    appConfig: IAppConfig,
    envKey: string,
    pgClient: PoolClient,
    migrationResult: IMigrationResult
  ): Promise<IMigrationResult> {
    const currentSchemaNames: string[] = await getSchemas(pgClient);
    const currentTableNames: string[] = await getTables(pgClient, ["_core"]);
    const currentExtensionNames: string[] = await getExtensions(pgClient);

    if (currentSchemaNames.indexOf("_core") < 0) {
      migrationResult.commands.push({
        sqls: [`CREATE SCHEMA ${getPgSelector("_core")};`],
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
      });
    }

    if (currentExtensionNames.indexOf("uuid-ossp") < 0) {
      migrationResult.commands.push({
        sqls: [`CREATE EXTENSION ${getPgSelector("uuid-ossp")};`],
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
      });
    }

    if (currentExtensionNames.indexOf("pgcrypto") < 0) {
      migrationResult.commands.push({
        sqls: [`CREATE EXTENSION ${getPgSelector("pgcrypto")};`],
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
      });
    }

    if (currentExtensionNames.indexOf("plv8") < 0) {
      migrationResult.commands.push({
        sqls: [`CREATE EXTENSION ${getPgSelector("plv8")};`],
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_SCHEMA,
      });
    }

    if (currentTableNames.indexOf("Migrations") < 0) {
      migrationResult.commands.push({
        sqls: [
          `
          CREATE TABLE "_core"."Migrations" (
            "id" uuid DEFAULT uuid_generate_v4(),
            "version" text NOT NULL,
            "appConfig" json NOT NULL,
            "runtimeConfig" json NOT NULL,
            "createdAt" timestamp without time zone NOT NULL DEFAULT timezone('UTC'::text, now()),
            PRIMARY KEY ("id"),
            UNIQUE ("version")
          );
          `,
        ],
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_TABLE,
      });
    }

    if (migrationResult.commands.length > 0) {
      // .replace(new RegExp("'", "g"), "\\'")
      migrationResult.commands.push({
        sqls: [
          `INSERT INTO "_core"."Migrations"("version", "appConfig", "runtimeConfig") VALUES('${version}', $OneJsonToken$${JSON.stringify(
            appConfig
          )}$OneJsonToken$, $OneJsonToken$${JSON.stringify(migrationResult.runtimeConfig)}$OneJsonToken$);`,
        ],
        operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
      });
    }

    return migrationResult;
  }

  private _getModuleCoreFunctionsByKey(key: string): IModuleCoreFunctions | null {
    for (const module of this._modules) {
      if (module.key === key) {
        return module;
      }
    }
    // eslint-disable-next-line @rushstack/no-null
    return null;
  }

  private _getModuleRuntimeConfigGetter(moduleKey: string): TGetModuleRuntimeConfig {
    return async (updateKey: string = "DEFAULT") => {
      if (this._runTimePgPool == null) {
        throw new Error("Cannot call getModuleRuntimeConfigGetter when the Pool is not started");
      }

      const pgClient: PoolClient = await this._runTimePgPool.connect();
      try {
        // eslint-disable-next-line prettier/prettier
        const latestMigration: ICoreMigration = await getLatestMigrationVersion(pgClient);
        await pgClient.release();

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

  public async generateMigration(
    version: string,
    appConfig: IAppConfig,
    envKey: string,
    pgPoolConfig: PoolConfig
  ): Promise<IMigrationResultWithFixes> {
    // TODO: @eugene: When I create an object of a class it makes no sense to define the type.
    // eslint-disable-next-line @typescript-eslint/typedef
    const pgPool = new Pool(pgPoolConfig);

    try {
      return await this.generateMigrationWithPgPool(version, appConfig, envKey, pgPool);
    } catch (e) {
      return {
        commands: [],
        errors: [
          {
            message: `Migration Failed: ${e.message}`,
            error: e,
          },
        ],
        warnings: [],
      };
    } finally {
      await pgPool.end();
    }
  }

  public async generateMigrationWithPgPool(
    version: string,
    appConfig: IAppConfig,
    envKey: string,
    pgPool: Pool,
    throwErrorOnInfiniteMigration: boolean = false
  ): Promise<IMigrationResultWithFixes> {
    // 1) Generate commands for the first time
    this._logger.info("Starting first migration generation...");
    const firstDbClient: PoolClient = await pgPool.connect();
    let firstGenerationResult: IMigrationResultWithFixes;
    try {
      await firstDbClient.query("BEGIN;");
      firstGenerationResult = await this._generateModuleMigrations(version, appConfig, envKey, firstDbClient);
      await firstDbClient.query("ROLLBACK;");
    } catch (err) {
      await firstDbClient.query("ROLLBACK;");
      return {
        errors: [
          {
            message: "Failed to generate migration commands.",
            error: err,
          },
        ],
        warnings: [],
        commands: [],
      };
    } finally {
      firstDbClient.release();
    }

    // If there are errors, or there is nothing to do, just return here
    if (firstGenerationResult.errors.length > 0 || firstGenerationResult.commands.length < 1) {
      return castMigrationResult(firstGenerationResult);
    }

    // 2) Try to run the migration
    const secondDbClient: PoolClient = await pgPool.connect();
    let secondGenerationResult: IMigrationResultWithFixes;
    this._logger.info("Run first migration...");
    try {
      await secondDbClient.query("BEGIN;");

      await asyncForEach(firstGenerationResult.commands, async (command: ICommand, commandIndex: number) => {
        await asyncForEach(command.sqls, async (sql: string, sqlIndex: number) => {
          try {
            await secondDbClient.query(sql);
          } catch (err) {
            firstGenerationResult.errors.push({
              message: `Failed to run query [${commandIndex}.${sqlIndex}]: [${sql}]`,
              error: err,
            });
            throw err;
          }
        });
      });

      // 3) try to generate the commands again to check if there are any infinite-migrations
      this._logger.info("Starting second migration generation...");
      try {
        secondGenerationResult = await this._generateModuleMigrations(version, appConfig, envKey, secondDbClient);
      } catch (err) {
        firstGenerationResult.errors.push({
          message: `Failed to generate second migration commands.`,
          error: err,
        });
        throw err;
      }
      await secondDbClient.query("ROLLBACK;");
    } catch (err) {
      await secondDbClient.query("ROLLBACK;");
      if (firstGenerationResult.errors.length < 1) {
        firstGenerationResult.errors.push({
          message: "Failed to run migrations and second command generation",
          error: err,
        });
      }
      return castMigrationResult(firstGenerationResult);
    } finally {
      secondDbClient.release();
    }

    // When we got any errors in second run inform the user and return with error
    if (secondGenerationResult.errors.length > 0) {
      firstGenerationResult.errors.push({
        message: "Second migration-command generation finished with errors. Adding them next, prefixed with 2).",
      });
      secondGenerationResult.errors.forEach((error) => {
        firstGenerationResult.errors.push({
          ...error,
          message: `2) ${error.message}`,
        });
      });
      return firstGenerationResult;
    }

    // If there are no commands in the second migration and we came here without an error, the migration is fine
    if (secondGenerationResult.commands.length < 1) {
      return castMigrationResult(firstGenerationResult);
    }

    firstGenerationResult.autoAppConfigFixes = [];

    // When there are commands in second migration this is an infinite-migration
    // Check if we can auto-fix them
    secondGenerationResult.commands.forEach((command) => {
      if (command.autoAppConfigFixes != null && firstGenerationResult.autoAppConfigFixes != null) {
        command.autoAppConfigFixes.forEach((autoSchemaFix) => {
          //@ts-ignore TODO: @eugene This is set before
          firstGenerationResult.autoAppConfigFixes.push(autoSchemaFix);
        });
        firstGenerationResult.warnings.push({
          message:
            "Your appConfig leads to infinite-migrations. Trying to auto-fix. If this fails, please check the command:",
          command,
        });
      } else {
        firstGenerationResult.errors.push({
          message: "Your appConfig leads to infinite-migrations. Please check the command:",
          command,
        });
      }
    });

    // Apply the auto-fixes to a new appConfig
    try {
      firstGenerationResult.fixedAppConfig = applyAutoAppConfigFixes(
        appConfig,
        firstGenerationResult.autoAppConfigFixes
      );
    } catch (err) {
      firstGenerationResult.errors.push({
        message: "Your appConfig leads to infinite-migrations. Auto-fix failed:",
        error: err,
      });
    }

    // If something failed until here, just return the errors
    if (firstGenerationResult.errors.length > 0) {
      return castMigrationResult(firstGenerationResult);
    }

    // If the auto-fix is disabled just return the errors
    if (throwErrorOnInfiniteMigration === true) {
      firstGenerationResult.errors.push({
        message: "Your appConfig leads to infinite-migrations. Auto-fix disabled.",
      });
      return castMigrationResult(firstGenerationResult);
    }

    let thirdMigrationResult: IMigrationResultWithFixes;

    // Try to re-run the migration with fixes, to see if they worked
    try {
      if (firstGenerationResult.fixedAppConfig == null) {
        throw new Error("The first run has not returned a fixedAppConfig.");
      }

      thirdMigrationResult = await this.generateMigrationWithPgPool(
        version,
        firstGenerationResult.fixedAppConfig,
        envKey,
        pgPool,
        true
      );

      if (thirdMigrationResult.errors.length > 0) {
        throw new Error("Result contains errors");
      }
    } catch (e) {
      firstGenerationResult.errors.push({
        message: "Your appConfig leads to infinite-migrations. Auto-fix tried but not working.",
      });
      return castMigrationResult(firstGenerationResult);
    }

    // If we come here the migration would run infinite, but could get auto-fixed
    thirdMigrationResult.warnings.push({
      message:
        "Your appConfig leads to infinite-migrations. It has been auto-fixed. You can remove this warning by applying the auto-fixes to your appConfig or taking the fixed appConfig.",
    });

    thirdMigrationResult.fixedAppConfig = firstGenerationResult.fixedAppConfig;
    thirdMigrationResult.autoAppConfigFixes = firstGenerationResult.autoAppConfigFixes;

    return castMigrationResult(thirdMigrationResult);
  }

  public printMigrationResult(result: IMigrationResultWithFixes): void {
    if (result.errors.length > 0) {
      // tslint:disable-next-line:no-console
      console.log("\x1b[31m");
      // tslint:disable-next-line:no-console
      console.log(" ===  Ordered Commands:  === ");

      result.commands.forEach((command: ICommand) => {
        command.sqls.forEach((sql) => {
          if (sql.startsWith(`INSERT INTO "_core"."Migrations"`) !== true) {
            // tslint:disable-next-line:no-console
            console.log(sql);
          }
        });
      });

      // tslint:disable-next-line:no-console
      console.log("\x1b[31m");
      // tslint:disable-next-line:no-console
      console.log(" ===  Errors:  === ");

      result.errors.forEach((error) => {
        // tslint:disable-next-line:no-console
        console.log("\x1b[31m", error.message);
        if (error.error != null) {
          // tslint:disable-next-line:no-console
          console.log("\x1b[31m", " ->", error);
        }
        if (error.command != null) {
          // tslint:disable-next-line:no-console
          console.log("\x1b[31m", " ->", error.command);
        }
        // tslint:disable-next-line:no-console
        // console.log("\x1b[31m", ' ->', JSON.stringify(error, null, 2));
      });
    }

    if (result.warnings.length > 0) {
      // tslint:disable-next-line:no-console
      console.log("\x1b[33m");
      // tslint:disable-next-line:no-console
      console.log(" ===  Warnings:  === ");

      result.warnings.forEach((warning) => {
        // tslint:disable-next-line:no-console
        console.log("\x1b[33m", warning.message);
        // tslint:disable-next-line:no-console
        // console.log("\x1b[33m", ' ->', JSON.stringify(warning, null, 2));
      });
    }

    /*console.log("\x1b[32m");
    console.log(" ===  Commands:  === ");
    result.commands.forEach((command: ICommand) => {
      command.sqls.forEach((sql) => {
        console.log(sql);
      });
    });*/
    if (result.errors.length < 1) {
      // tslint:disable-next-line:no-console
      console.log("\x1b[32m");
      // tslint:disable-next-line:no-console
      console.log(" ===  Ordered Commands:  === ");

      result.commands.forEach((command: ICommand) => {
        command.sqls.forEach((sql) => {
          if (sql.startsWith(`INSERT INTO "_core"."Migrations"`) !== true) {
            // tslint:disable-next-line:no-console
            console.log(sql);
          }
        });
      });

      // tslint:disable-next-line:no-console
      console.log("\x1b[32m");
      // tslint:disable-next-line:no-console
      console.log(`
  _____ _    _  _____ _____ ______  _____ _____ 
/ ____| |  | |/ ____/ ____|  ____|/ ____/ ____|
| (___ | |  | | |   | |    | |__  | (___| (___  
\\___ \\| |  | | |   | |    |  __|  \\___ \\\\___ \\ 
____) | |__| | |___| |____| |____ ____) |___) |
|_____/ \\____/ \\_____\\_____|______|_____/_____/ 
    `);
    }
  }

  public async applyMigrationResult(result: IMigrationResultWithFixes, pgPoolConfig: PoolConfig): Promise<void> {
    if (result.errors.length < 1 && result.commands.length > 0) {
      const pgPool: Pool = new Pool(pgPoolConfig);

      const pgClient: PoolClient = await pgPool.connect();

      try {
        await pgClient.query("BEGIN;");
        await asyncForEach(result.commands, async (command: ICommand) => {
          await asyncForEach(command.sqls, async (sql: string) => {
            await pgClient.query(sql);
          });
        });
        await pgClient.query("COMMIT;");
        // tslint:disable-next-line:no-console
        console.log("\x1b[32m");
        // tslint:disable-next-line:no-console
        console.log("SUCCESSFUL MIGRATION!");
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error("\x1b[31m", "Migration Failed", e);
        await pgClient.query("ROLLBACK;");
      } finally {
        await pgClient.release();
      }
      this._logger.info("core.migration.ready", `Took ${process.hrtime(STARTUP_TIME)} seconds.`);
      await pgPool.end();
    }
  }

  public async boot(pgPoolConfig: PoolConfig): Promise<void> {
    this._logger.info("Booting Application...");
    this._runTimePgPool = new Pool(pgPoolConfig);

    this._state = EBootState.Booting;

    // const pgClient = await this.runTimePgPool.connect();
    try {
      /* const latestMigration = await getLatestMigrationVersion(pgClient);
      await pgClient.release();

      if (latestMigration == null) {
        throw new Error("This database has no runtimeConfig.");
      }*/

      // console.log('RR', JSON.stringify(latestMigration, null, 2));
      // this.runTimePgPool.end();
      // return;

      for (const moduleObject of this._modules) {
        if (moduleObject.boot != null) {
          // const moduleRuntimeConfig = latestMigration.runtimeConfig[moduleObject.key] || {};
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
    return new Logger({
      instanceName: "", // TODO: Set instance-name
      name,
      minLevel,
      exposeStack,
      displayInstanceName: true,
    });
  }
}
