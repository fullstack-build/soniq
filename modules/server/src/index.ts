import { Core, PoolClient, IModuleMigrationResult, DI, Logger, Pool, ExtensionConnector } from "soniq";
import * as http from "http";
// other npm dependencies
import * as Koa from "koa";
import * as compose from "koa-compose";
import * as compress from "koa-compress";
import { TGetServerModuleRuntimeConfig, IServerAppConfig } from "./interfaces";

export * from "./moduleDefinition";

export { Koa };

export class ServerExtensionConnector extends ExtensionConnector {
  private _server: Server;
  private _koaMiddlewareKeys: string[] = [];

  public constructor(server: Server) {
    super();
    this._server = server;
  }

  public addKoaMiddleware(middleware: Koa.Middleware): void {
    this._koaMiddlewareKeys.push(this._server.addMiddleware(middleware));
  }

  public detach(): void {
    for (const key of this._koaMiddlewareKeys) {
      this._server.removeMiddleware(key);
    }
  }
}

@DI.singleton()
export class Server {
  private _server: http.Server;
  private _app: Koa | undefined;
  private _core: Core;

  private _logger: Logger;

  private _extensionMiddlewares: {
    [key: string]: Koa.Middleware;
  } = {};

  private _getRuntimeConfig: TGetServerModuleRuntimeConfig = (updateKey?: string) => {
    throw new Error(`Cannot get RuntimeConfig while booting hasn't finished.`);
  };

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(@DI.inject(Core) core: Core) {
    this._core = core;
    this._logger = core.getLogger("Server");

    this._bootKoa();
    //@ts-ignore TODO: @eugene this.bootKoa(); will initiate this.app or throw an error
    this._server = http.createServer(this._app.callback());

    this._core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
      createExtensionConnector: this._createExtensionConnector.bind(this),
    });
  }

  private async _migrate(appConfig: IServerAppConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    return {
      moduleRuntimeConfig: appConfig,
      commands: [],
      errors: [],
      warnings: [],
    };
  }

  private async _boot(getRuntimeConfig: TGetServerModuleRuntimeConfig, pgPool: Pool): Promise<void> {
    this._getRuntimeConfig = getRuntimeConfig;

    try {
      // start KOA on PORT
      this._server.listen(process.env.PORT || 3030);

      // success log
      this._logger.info("Server listening on port", process.env.PORT || 3030);
    } catch (e) {
      this._logger.fatal("Failed to listen to port", e);
    }
  }

  private _createExtensionConnector(): ServerExtensionConnector {
    return new ServerExtensionConnector(this);
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
        const { runtimeConfig, hasBeenUpdated } = await this._getRuntimeConfig("COMPRESSION");

        if (compressionCache == null || hasBeenUpdated === true) {
          compressionCache = compress({
            ...runtimeConfig.compression,
            flush: require("zlib").Z_SYNC_FLUSH,
          });
        }

        return compressionCache(ctx, next);
      });

      this._app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        await compose(Object.values(this._extensionMiddlewares))(ctx, next);
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

  public addMiddleware(middleware: Koa.Middleware): string {
    const key: string = `MIDDLEWARE_${Date.now()}_${Math.random()}`;

    this._extensionMiddlewares[key] = middleware;

    return key;
  }

  public removeMiddleware(key: string): void {
    delete this._extensionMiddlewares[key];
  }
}
