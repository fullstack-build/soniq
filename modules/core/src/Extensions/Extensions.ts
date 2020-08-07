import {
  Core,
  DI,
  PoolClient,
  TGetModuleRuntimeConfig,
  Pool,
  Logger,
  ExtensionConnector,
  IModuleCoreFunctions,
} from "..";
import { IModuleMigrationResult } from "../Migration/interfaces";

// @ts-ignore TODO: This module has no definition
import * as ncc from "@zeit/ncc";
import { IExtensionsAppConfig, IExtension, TDetachFunction, TRegisterFunction } from "./interfaces";

import * as crypto from "crypto";
import { getTables } from "../Migration/helpers";
import { OPERATION_SORT_POSITION } from "../Migration/constants";
import { ICurrentExtension, getCurrentExtensions, getRuntimeExtensions, IRuntimeExtension } from "./helpers";
import { NodeVM } from "vm2";
import * as soniq from "../";
import { prepareRegister, getExtensionRegisterFunction } from "./register";

const extensionBuildCache: { [key: string]: string } = {};

function sha1(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}

export interface IAttachedExtension {
  name: string;
  codeHash: string;
  detach: TDetachFunction;
  extensionConnectors: ExtensionConnector[];
}

export interface INccResult {
  code: string;
}

@DI.singleton()
export class Extensions {
  private _logger: Logger;
  private _attachedExtensions: IAttachedExtension[] = [];
  private _pgPool: Pool | null = null;
  private _core: Core;

  public constructor(@DI.inject(DI.delay(() => Core)) core: Core) {
    core.addCoreFunctions({
      key: "Extensions",
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
    });

    this._logger = core.getLogger("Extensions");
    this._core = core;
  }

  private async _migrate(appConfig: IExtensionsAppConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    const migrationResult: IModuleMigrationResult = {
      moduleRuntimeConfig: {},
      errors: [],
      warnings: [],
      commands: [],
    };
    const currentTableNames: string[] = await getTables(pgClient, ["_core"]);
    let currentExtensions: ICurrentExtension[] = [];

    if (currentTableNames.indexOf("Extensions") < 0) {
      migrationResult.commands.push({
        sqls: [
          `
            CREATE TABLE "_core"."Extensions" (
              "name" text NOT NULL,
              "code" text NOT NULL,
              "codeHash" text NOT NULL,
              "createdAt" timestamp without time zone NOT NULL DEFAULT timezone('UTC'::text, now()),
              PRIMARY KEY ("name"),
              UNIQUE ("name")
            );
            `,
        ],
        operationSortPosition: OPERATION_SORT_POSITION.CREATE_TABLE,
      });
    } else {
      currentExtensions = await getCurrentExtensions(pgClient);
    }

    const currentExtensionsByName: { [key: string]: ICurrentExtension } = {};

    const newNames: string[] = appConfig.extensions.map((extension) => {
      return extension.name;
    });

    for (const currentExtension of currentExtensions) {
      currentExtensionsByName[currentExtension.name] = currentExtension;

      if (newNames.indexOf(currentExtension.name) < 0) {
        migrationResult.commands.push({
          sqls: [`DELETE FROM _core."Extensions" WHERE name = '${currentExtension.name}';`],
          operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
        });
      }
    }

    this._logger.info(`Building [${appConfig.extensions.length}] extensions...`);

    for (const [index, extension] of appConfig.extensions.entries()) {
      this._logger.info(`[${index + 1}/${appConfig.extensions.length}] Building "${extension.name}" extension`);
      try {
        let code: string = "";

        if (extensionBuildCache[extension.mainPath] != null) {
          code = extensionBuildCache[extension.mainPath];
        } else {
          const build: INccResult = await ncc(extension.mainPath, {
            externals: ["soniq", "@soniq/graphql", "@soniq/core", "@soniq/auth", "@soniq/server"],
          });

          code = build.code;
        }

        // eslint-disable-next-line require-atomic-updates
        extensionBuildCache[extension.mainPath] = code;

        this._logger.info(
          `[${index + 1}/${appConfig.extensions.length}] Successful built "${extension.name}" extension`
        );

        const codeHash: string = sha1(code);

        if (currentExtensionsByName[extension.name] != null) {
          if (currentExtensionsByName[extension.name].codeHash !== codeHash) {
            currentExtensionsByName[extension.name].codeHash = codeHash;
            migrationResult.commands.push({
              sqls: [
                `UPDATE _core."Extensions" SET code=$SoniqDataToken$${code}$SoniqDataToken$, "codeHash"=$SoniqDataToken$${codeHash}$SoniqDataToken$ WHERE name = $SoniqDataToken$${extension.name}$SoniqDataToken$`,
              ],
              operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
            });
          }
        } else {
          currentExtensionsByName[extension.name] = {
            name: extension.name,
            codeHash,
          };
          migrationResult.commands.push({
            sqls: [
              `INSERT INTO _core."Extensions"(name, code, "codeHash") VALUES('${extension.name}', $SoniqDataToken$${code}$SoniqDataToken$, $SoniqDataToken$${codeHash}$SoniqDataToken$);`,
            ],
            operationSortPosition: OPERATION_SORT_POSITION.INSERT_DATA,
          });
        }
      } catch (err) {
        this._logger.info(
          `[${index + 1}/${appConfig.extensions.length}] Failed to build "${extension.name}" extension`
        );
        migrationResult.errors.push({
          message: `NCC Error: ${err.message}`,
          error: err,
        });
      }
    }

    /* migrationResult.moduleRuntimeConfig.extensions = Object.values(currentExtensionsByName).sort(
      (a: ICurrentExtension, b: ICurrentExtension) => {
        if (a.name > b.name) {
          return 1;
        }
        if (a.name > b.name) {
          return -1;
        }
        return 0;
      }
    ); */

    // console.log("EXT RES:", migrationResult.moduleRuntimeConfig.extensions);

    return migrationResult;
  }

  private async _boot(getRuntimeConfig: TGetModuleRuntimeConfig, pgPool: Pool): Promise<void> {
    this._pgPool = pgPool;

    await this._updateExtensions();

    this._core.getEventEmitter().on("runtimeConfigUpdate", async () => {
      await this._updateExtensions();
    });
  }

  private async _updateExtensions(): Promise<void> {
    if (this._pgPool == null) {
      throw new Error("The Pool is not available yet.");
    }
    const pgClient: PoolClient = await this._pgPool.connect();
    try {
      const extensions: IRuntimeExtension[] = await getRuntimeExtensions(pgClient);

      const newExtensionsByName: { [name: string]: IRuntimeExtension } = {};

      for (const extension of extensions) {
        newExtensionsByName[extension.name] = extension;
        let foundValidExtension: boolean = false;

        for (const attachedExtension of this._attachedExtensions) {
          if (attachedExtension.name === extension.name) {
            if (attachedExtension.codeHash !== extension.codeHash) {
              await this._detachExtension(attachedExtension.name);
            } else {
              foundValidExtension = true;
            }
          }
        }

        if (foundValidExtension !== true) {
          await this._attachExtension(extension);
        }
      }

      for (const attachedExtension of this._attachedExtensions) {
        if (newExtensionsByName[attachedExtension.name] == null) {
          await this._detachExtension(attachedExtension.name);
        }
      }
    } catch (err) {
      this._logger.error("Failed to load extensions", err);
    } finally {
      pgClient.release();
    }
  }

  private async _attachExtension(extension: IRuntimeExtension): Promise<void> {
    this._logger.info(`Loading extension "${extension.name}" with hash "${extension.codeHash}"...`);
    try {
      const vm: NodeVM = new NodeVM({
        timeout: 1000,
        require: {
          external: true,
          mock: {
            soniq,
          },
        },
      });

      prepareRegister();
      vm.run(extension.code);
      const registerNewExtension: TRegisterFunction | null = getExtensionRegisterFunction();

      if (registerNewExtension == null) {
        throw new Error(`The code of extension "${extension.name}" has not set a register function.`);
      }

      this._logger.info(`Register extension "${extension.name}" with hash "${extension.codeHash}"...`);

      const runtimeExtension: IExtension = registerNewExtension();

      this._logger.info(`Attach extension "${extension.name}" with hash "${extension.codeHash}"...`);

      const attachedExtension: IAttachedExtension = {
        name: extension.name,
        codeHash: extension.codeHash,
        detach: runtimeExtension.detach,
        extensionConnectors: [],
      };

      runtimeExtension.attach(this._logger, (moduleKey: string) => {
        const coreFunctions: IModuleCoreFunctions | null = this._core._getModuleCoreFunctionsByKey(moduleKey);

        if (coreFunctions == null) {
          throw new Error(`The Module with key "${moduleKey}" does not exist.`);
        }

        if (coreFunctions.createExtensionConnector == null) {
          throw new Error(`The Module with key "${moduleKey}" has no ExtensionConnector.`);
        }

        const extensionConnector: ExtensionConnector = coreFunctions.createExtensionConnector();

        attachedExtension.extensionConnectors.push(extensionConnector);

        return extensionConnector;
      });

      this._attachedExtensions.push(attachedExtension);
    } catch (err) {
      this._logger.error(
        `Failed to load, register or attach extension "${extension.name}" with hash "${extension.codeHash}"...`,
        err
      );
    }
  }

  private async _detachExtension(name: string): Promise<void> {
    const attachedExtensionIndex: number = this._attachedExtensions.findIndex((ext) => {
      return ext.name === name;
    });

    const attachedExtension: IAttachedExtension = this._attachedExtensions[attachedExtensionIndex];

    this._attachedExtensions.splice(attachedExtensionIndex, 1);

    this._logger.info(`Detach extension "${attachedExtension.name}" with hash "${attachedExtension.codeHash}"...`);

    for (const connector of attachedExtension.extensionConnectors) {
      connector.detach();
    }

    attachedExtension.detach(this._logger);
  }

  private _addExtensionConnector(extensionName: string, extensionConnector: ExtensionConnector): void {
    const attachedExtensionIndex: number = this._attachedExtensions.findIndex((ext) => {
      return ext.name === extensionName;
    });

    if (attachedExtensionIndex < 0 || this._attachedExtensions[attachedExtensionIndex] == null) {
      throw new Error(`Could not find extension "${extensionName}". Maybe already detached.`);
    }

    this._attachedExtensions[attachedExtensionIndex].extensionConnectors.push(extensionConnector);
  }
}
