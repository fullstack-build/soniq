import { Service, Inject, Core, Logger } from "soniq";
import { Server as HttpServer, createServer } from "http";
import * as Koa from "koa";
import * as compress from "koa-compress";

interface IServerConfig {
  port: number;
  compression: {
    threshold: number;
  };
}

@Service()
export class Server {
  private _core: Core;
  private _log: Logger;
  private _serverConfig: IServerConfig;
  private _server: HttpServer;
  private _app: Koa = new Koa();

  public constructor(@Inject((type: Core) => Core) core: Core) {
    this._core = core;
    this._log = this._core.getLogger(this.constructor.name);
    this._log.info("I AM the Soniq server constructor!");
    this._serverConfig = this._core.configManager.registerConfig<IServerConfig>(
      "Server",
      `${__dirname}/../config`
    );
    console.log("##", this._serverConfig);

    this._bootKoa();
    this._server = createServer(this._app.callback());
  }

  private _bootKoa(): void {
    try {
      // enable compression
      this._app.use(
        compress({
          ...this._serverConfig.compression,
          flush: require("zlib").Z_SYNC_FLUSH,
        })
      );

      // TODO: Add health-check Endpoint here

      // Block all requests when server has not finished booting
      this._app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        await this._core.boot();
        await next();
      });
    } catch (e) {
      this._log.error(e);
    }
  }
}
