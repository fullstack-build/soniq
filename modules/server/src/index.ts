import { Core, DI, Logger, Pool } from "soniq";
import * as http from "http";
// other npm dependencies
import * as Koa from "koa";
import * as compress from "koa-compress";
import { IServerAppConfig } from "./moduleDefinition/interfaces";

export * from "./moduleDefinition";

export { Koa };

@DI.singleton()
export class Server {
  private _server: http.Server;
  private _app: Koa | undefined;
  private _core: Core;
  private _logger: Logger;
  private _appConfig: IServerAppConfig;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(@DI.inject(Core) core: Core) {
    this._core = core;
    this._logger = core.getLogger("Server");

    this._bootKoa();
    //@ts-ignore TODO: @eugene this.bootKoa(); will initiate this.app or throw an error
    this._server = http.createServer(this._app.callback());

    this._appConfig = this._core.initModule({
      key: this.constructor.name,
      boot: this._boot.bind(this),
    });
  }

  private async _boot(moduleRunConfig: {}, pgPool: Pool): Promise<void> {
    try {
      this._server.listen(process.env.PORT || 4242);

      // success log
      this._logger.info("Server listening on port", process.env.PORT || 4242);
    } catch (e) {
      this._logger.fatal("Failed to listen to port", e);
      throw e;
    }
  }

  private _bootKoa(): void {
    try {
      this._app = new Koa();
      // enable compression

      // TODO: Add health-check Endpoint here

      // Block all requests when server has not finished booting
      this._app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        await this._core.hasBootedPromise();
        await next();
      });

      let compressionCache: Koa.Middleware | null = null;

      this._app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        if (compressionCache == null) {
          compressionCache = compress({
            ...this._appConfig.compression,
            flush: require("zlib").Z_SYNC_FLUSH,
          });
        }

        return compressionCache(ctx, next);
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
