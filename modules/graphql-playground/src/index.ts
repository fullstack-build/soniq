import { Core, DI, Logger, Pool } from "soniq";
import { IGraphqlPlaygroundAppConfig } from "./moduleDefinition/interfaces";
import { Server, Koa } from "@soniq/server";
import koaPlayground from "graphql-playground-middleware-koa";

export * from "./moduleDefinition";

@DI.singleton()
export class GraphqlPlayground {
  private _core: Core;
  private _server: Server;

  private _logger: Logger;
  private _appConfig: IGraphqlPlaygroundAppConfig;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(@DI.inject(Core) core: Core, @DI.inject(Server) server: Server) {
    this._core = core;
    this._server = server;
    this._logger = core.getLogger("GraphqlPlayground");

    this._appConfig = this._core.initModule({
      key: this.constructor.name,
      boot: this._boot.bind(this),
    });
  }

  private async _boot(moduleRunConfig: {}, pgPool: Pool): Promise<void> {
    const app: Koa = this._server.getApp();

    let playgroundMiddleware: Koa.Middleware | null = null;

    app.use(async (ctx: Koa.Context, next: Koa.Next) => {
      if (this._appConfig.disabled === true || ctx.request.path !== (this._appConfig.playgroundPath || "/playground")) {
        return next();
      }

      if (playgroundMiddleware == null) {
        playgroundMiddleware = koaPlayground(this._appConfig.middlewareConfig);
      }

      return await playgroundMiddleware(ctx, next);
    });
  }
}
