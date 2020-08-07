const STARTUP_TIME: [number, number] = process.hrtime();

import { IAppConfig } from "../interfaces";

import {
  IMigrationResult,
  IModuleMigrationResult,
  IObjectTrace,
  IAutoAppConfigFix,
  IAppMigrationResult,
  IMigrationResultWithFixes,
} from "./interfaces";

import { Pool, PoolClient, PoolConfig } from "pg";
import { applyAutoAppConfigFixes, buildMigrationResult, getTables } from "./helpers";

import { SoniqApp, SoniqEnvironment, SoniqAppConfigOverwrite } from "../Application";
import { Logger, Core, IModuleCoreFunctions } from "..";
import { generateCoreMigrations } from "./coreMigrations";
import { printMigrationResult } from "./printer";
import { getLatestMigrationVersion, ICoreMigration } from "../helpers";

export class Migration {
  private _logger: Logger;
  private _core: Core;

  public constructor(logger: Logger, core: Core) {
    this._logger = logger;
    this._core = core;
  }

  public async deployApp(app: SoniqApp, env: SoniqEnvironment): Promise<void> {
    const migrationResult: IMigrationResultWithFixes = await this.generateMigration(app, env);
    const objectTraces: IObjectTrace[] = app._buildObjectTraces();

    printMigrationResult(migrationResult, objectTraces, this._logger);

    await this.applyMigrationResult(migrationResult, env.getPgConfig());
  }

  public async generateMigration(app: SoniqApp, env: SoniqEnvironment): Promise<IMigrationResultWithFixes> {
    let appConfig: IAppConfig = app._build();

    env.getAppConfigOverwrites().forEach((appConfigOverwrite: SoniqAppConfigOverwrite) => {
      appConfig = appConfigOverwrite._build(JSON.parse(JSON.stringify(appConfig)));
    });
    let nextVersion: number = 0;
    const pgPool: Pool = new Pool(env.getPgConfig());

    try {
      const pgClient: PoolClient = await pgPool.connect();
      const currentTableNames: string[] = await getTables(pgClient, ["_core"]);

      if (currentTableNames.indexOf("Migrations") >= 0) {
        const lastMigration: ICoreMigration | null = await getLatestMigrationVersion(pgClient);

        if (lastMigration != null) {
          nextVersion = lastMigration.version + 1;
        }
      }
      pgClient.release();
    } catch (e) {
      console.log("Error", e);
      throw e;
    } finally {
      await pgPool.end();
    }

    return this.generateMigrationWithAppConfigAndPool(nextVersion, appConfig, env.getPgConfig());
  }

  public async generateMigrationWithAppConfigAndPool(
    version: number,
    appConfig: IAppConfig,
    pgPoolConfig: PoolConfig
  ): Promise<IMigrationResultWithFixes> {
    const pgPool: Pool = new Pool(pgPoolConfig);

    try {
      return await this.generateMigrationWithPgPool(version, appConfig, pgPool);
    } catch (e) {
      return buildMigrationResult({
        commands: [],
        errors: [
          {
            message: `Migration Failed: ${e.message}`,
            error: e,
          },
        ],
        warnings: [],
      });
    } finally {
      await pgPool.end();
    }
  }

  public async generateMigrationWithPgPool(
    version: number,
    appConfig: IAppConfig,
    pgPool: Pool,
    throwErrorOnInfiniteMigration: boolean = false
  ): Promise<IMigrationResultWithFixes> {
    this._logger.info("Start of generating migration commands...");
    // 1) Generate commands for the first time
    this._logger.info("Starting first migration generation...");
    const firstDbClient: PoolClient = await pgPool.connect();
    let firstGenerationResult: IMigrationResult;
    const autoAppConfigFixes: IAutoAppConfigFix[] = [];
    let fixedAppConfig: IAppConfig | null = null;

    try {
      await firstDbClient.query("BEGIN;");
      firstGenerationResult = await this._generateModuleMigrations(version, appConfig, firstDbClient);
      await firstDbClient.query("ROLLBACK;");
    } catch (err) {
      await firstDbClient.query("ROLLBACK;");
      this._logger.error("First migration generation failed.");

      this._logger.info("Migration generation finished.");

      return buildMigrationResult({
        errors: [
          {
            message: "Failed to generate migration commands.",
            error: err,
          },
        ],
        warnings: [],
        commands: [],
      });
    } finally {
      firstDbClient.release();
    }

    // If there are errors, or there is nothing to do, just return here
    if (firstGenerationResult.errors.length > 0 || firstGenerationResult.commands.length < 1) {
      this._logger.info("First migration generation finished with errors or no commands.");
      this._logger.info("Migration generation finished.");

      return buildMigrationResult(firstGenerationResult);
    }

    // 2) Try to run the migration
    const secondDbClient: PoolClient = await pgPool.connect();
    let secondGenerationResult: IMigrationResult;
    this._logger.info("Run first migration...");
    try {
      await secondDbClient.query("BEGIN;");

      for (const [commandIndex, command] of firstGenerationResult.commands.entries()) {
        for (const [sqlIndex, sql] of command.sqls.entries()) {
          try {
            await secondDbClient.query(sql);
          } catch (err) {
            firstGenerationResult.errors.push({
              message: `Failed to run query [${commandIndex}.${sqlIndex}]: [${sql}]`,
              error: err,
              objectId: command.objectId,
              command,
            });
            throw err;
          }
        }
      }
      this._logger.info("First migration run finished successfully.");

      // 3) try to generate the commands again to check if there are any infinite-migrations
      this._logger.info("Starting second migration generation...");
      try {
        secondGenerationResult = await this._generateModuleMigrations(version, appConfig, secondDbClient);
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
      this._logger.info("First migration run or second generation failed.");
      if (firstGenerationResult.errors.length < 1) {
        firstGenerationResult.errors.push({
          message: "Failed to run migrations and second command generation",
          error: err,
        });
      }
      this._logger.info("Migration generation finished.");

      return buildMigrationResult(firstGenerationResult);
    } finally {
      secondDbClient.release();
    }

    // When we got any errors in second run inform the user and return with error
    if (secondGenerationResult.errors.length > 0) {
      this._logger.info("Second migration generation finished with errors.");
      firstGenerationResult.errors.push({
        message: "Second migration-command generation finished with errors. Adding them next, prefixed with 2).",
      });
      secondGenerationResult.errors.forEach((error) => {
        firstGenerationResult.errors.push({
          ...error,
          message: `2) ${error.message}`,
        });
      });
      this._logger.info("Migration generation finished.");

      return buildMigrationResult(firstGenerationResult);
    }

    // If there are no commands in the second migration and we came here without an error, the migration is fine
    if (secondGenerationResult.commands.length < 1) {
      this._logger.info("Second migration generation finished without commands. So the first is valid:");
      this._logger.info("Migration generation finished.");

      return buildMigrationResult(firstGenerationResult);
    }

    this._logger.info("Second migration generation finished with commands. Trying to find auto-fixes...");

    // When there are commands in second migration this is an infinite-migration
    // Check if we can auto-fix them
    secondGenerationResult.commands.forEach((command) => {
      if (command.autoAppConfigFixes != null) {
        command.autoAppConfigFixes.forEach((autoSchemaFix) => {
          autoAppConfigFixes.push(autoSchemaFix);
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

    if (autoAppConfigFixes.length > 0) {
      this._logger.info("Found some auto-fixes. Trying to apply them...");
    }

    // Apply the auto-fixes to a new appConfig
    try {
      fixedAppConfig = applyAutoAppConfigFixes(appConfig, autoAppConfigFixes);
    } catch (err) {
      this._logger.info("Auto-Fixing failed.");
      firstGenerationResult.errors.push({
        message: "Your appConfig leads to infinite-migrations. Auto-fix failed:",
        error: err,
      });
    }

    // If something failed until here, just return the errors
    if (firstGenerationResult.errors.length > 0) {
      this._logger.info("Some auto-fixes failed.");
      this._logger.info("Migration generation finished.");

      return buildMigrationResult(firstGenerationResult, autoAppConfigFixes);
    }

    // If the auto-fix is disabled just return the errors
    if (throwErrorOnInfiniteMigration === true) {
      firstGenerationResult.errors.push({
        message: "Your appConfig leads to infinite-migrations. Auto-fix disabled.",
      });
      this._logger.info("Auto-fixing disabled. We do not apply them.");
      this._logger.info("Migration generation finished.");

      return buildMigrationResult(firstGenerationResult, autoAppConfigFixes);
    }

    this._logger.info("Starting Third migration generation with applied auto-fixes...");

    let thirdMigrationResult: IMigrationResultWithFixes;

    // Try to re-run the migration with fixes, to see if they worked
    try {
      if (fixedAppConfig == null) {
        throw new Error("The first run has not returned a fixedAppConfig.");
      }

      thirdMigrationResult = await this.generateMigrationWithPgPool(version, fixedAppConfig, pgPool, true);

      if (thirdMigrationResult.errors.length > 0) {
        this._logger.info("Third migration generation finished with errors.");
        throw new Error("Result contains errors");
      }
    } catch (error) {
      firstGenerationResult.errors.push({
        message: "Your appConfig leads to infinite-migrations. Auto-fix tried but not working.",
        error,
      });
      this._logger.info("Third migration generation failed.");
      this._logger.info("Migration generation finished.");

      return buildMigrationResult(firstGenerationResult, autoAppConfigFixes);
    }

    this._logger.info("Third migration generation successful. Please apply auto-fixes.");

    // If we come here the migration would run infinite, but could get auto-fixed
    thirdMigrationResult.warnings.push({
      message:
        "Your appConfig leads to infinite-migrations. It has been auto-fixed. You can remove this warning by applying the auto-fixes to your appConfig or taking the fixed appConfig.",
    });

    this._logger.info("Migration generation finished.");

    return buildMigrationResult(thirdMigrationResult, autoAppConfigFixes, fixedAppConfig);
  }

  public async applyMigrationResult(result: IMigrationResultWithFixes, pgPoolConfig: PoolConfig): Promise<void> {
    if (result.errors.length < 1 && result.commands.length > 0) {
      this._logger.info("Deploying application...");
      const pgPool: Pool = new Pool(pgPoolConfig);

      const pgClient: PoolClient = await pgPool.connect();

      try {
        await pgClient.query("BEGIN;");
        for (const command of result.commands) {
          for (const sql of command.sqls) {
            await pgClient.query(sql);
          }
        }
        await pgClient.query("COMMIT;");
        this._logger.info("Deployment successful.");
        console.log("\u001b[32;1mSUCCESSFUL DEPLOYMENT!");
      } catch (e) {
        this._logger.info("Deployment failed.", e);
        console.error("\x1b[31m", "Deployment Failed");
        await pgClient.query("ROLLBACK;");
      } finally {
        await pgClient.release();
      }
      this._logger.info(`Finished Took ${process.hrtime(STARTUP_TIME)} seconds.`);
      await pgPool.end();
    }
  }

  private async _generateModuleMigrations(
    version: number,
    appConfig: IAppConfig,
    pgClient: PoolClient
  ): Promise<IMigrationResult> {
    const result: IAppMigrationResult = {
      runtimeConfig: {},
      errors: [],
      warnings: [],
      commands: [],
    };

    for (const moduleConfig of appConfig.modules) {
      const moduleCoreFunctions: IModuleCoreFunctions | null = this._core._getModuleCoreFunctionsByKey(
        moduleConfig.key
      );

      if (moduleCoreFunctions == null) {
        result.errors.push({
          message: `The module with key '${moduleConfig.key}' does not exist on this system.`,
        });
      } else {
        if (moduleCoreFunctions.migrate != null) {
          const moduleMigrationResult: IModuleMigrationResult = await moduleCoreFunctions.migrate(
            moduleConfig.appConfig,
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
    }

    const rawResult: IMigrationResult = await generateCoreMigrations(version, appConfig, pgClient, result);

    rawResult.commands.sort((a, b) => {
      return a.operationSortPosition - b.operationSortPosition;
    });

    return rawResult;
  }
}
