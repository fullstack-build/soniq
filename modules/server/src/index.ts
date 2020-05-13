import {
  Core,
  IModuleAppConfig,
  IModuleEnvConfig,
  PoolClient,
  IModuleMigrationResult,
  Service,
  Inject,
  Logger,
} from "soniq";
import * as http from "http";
// other npm dependencies
import * as Koa from "koa";
import * as compress from "koa-compress";

export { Koa };

@Service()
export class Server {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _serverConfig: any = {
    port: 3030,
    compression: {
      threshold: 2048,
    },
  };
  private _server: http.Server;
  private _app: Koa | undefined;
  private _core: Core;

  private _logger: Logger;

  public constructor(@Inject((tpye) => Core) core: Core) {
    this._core = core;
    this._logger = core.getLogger("Server");

    this._bootKoa();
    //@ts-ignore TODO: @eugene this.bootKoa(); will initiate this.app or throw an error
    this._server = http.createServer(this._app.callback());

    this._core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
    });
  }

  private async _migrate(
    appConfig: IModuleAppConfig,
    envConfig: IModuleEnvConfig,
    pgClient: PoolClient
  ): Promise<IModuleMigrationResult> {
    return {
      moduleRuntimeConfig: {},
      commands: [],
      errors: [],
      warnings: [],
    };
  }

  private async _boot(): Promise<void> {
    try {
      // start KOA on PORT
      this._server.listen(this._serverConfig.port);

      // success log
      this._logger.info("Server listening on port", this._serverConfig.port);
    } catch (e) {
      this._logger.fatal("Failed to listen to port", e);
    }
  }

  private _bootKoa(): void {
    try {
      this._app = new Koa();
      // enable compression
      this._app.use(
        compress({
          ...this._serverConfig.compression,
          flush: require("zlib").Z_SYNC_FLUSH,
        })
      );

      // TODO: Add health-check Endpoint here

      // Block all requests when server has not finished booting
      this._app.use(async (ctx: unknown, next: () => Promise<unknown>) => {
        await this._core.hasBootedPromise();
        await next();
      });
    } catch (e) {
      this._logger.fatal("Failed to init koa", e);
      throw e;
    }
  }

  public getApp(): Koa {
    if (this._app == null) {
      throw new Error("Cannot get koa app. Because it has not been initialised");
    }

    return this._app;
  }

  public getServer(): http.Server {
    return this._server;
  }
}
