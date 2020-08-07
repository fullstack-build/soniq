import { Core, PoolClient, IModuleMigrationResult, DI, Logger, Pool } from "soniq";
import { TGetGraphqlPlaygroundModuleRuntimeConfig, IGraphqlPlaygroundAppConfig } from "./interfaces";
import { Server, Koa } from "@soniq/server";
import koaPlayground from "graphql-playground-middleware-koa";
import { MiddlewareOptions } from "graphql-playground-html";

export * from "./moduleDefinition";

@DI.singleton()
export class GraphqlPlayground {
  private _core: Core;
  private _server: Server;

  private _logger: Logger;

  private _getRuntimeConfig: TGetGraphqlPlaygroundModuleRuntimeConfig = (updateKey?: string) => {
    throw new Error(`Cannot get RuntimeConfig while booting hasn't finished.`);
  };

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public constructor(@DI.inject(Core) core: Core, @DI.inject(Server) server: Server) {
    this._core = core;
    this._server = server;
    this._logger = core.getLogger("GraphqlPlayground");

    this._core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this._migrate.bind(this),
      boot: this._boot.bind(this),
    });
  }

  private async _migrate(
    appConfig: IGraphqlPlaygroundAppConfig,
    pgClient: PoolClient
  ): Promise<IModuleMigrationResult> {
    return {
      moduleRuntimeConfig: appConfig,
      commands: [],
      errors: [],
      warnings: [],
    };
  }

  private async _boot(getRuntimeConfig: TGetGraphqlPlaygroundModuleRuntimeConfig, pgPool: Pool): Promise<void> {
    this._getRuntimeConfig = getRuntimeConfig;

    const app: Koa = this._server.getApp();

    let playgroundMiddleware: Koa.Middleware | null = null;

    app.use(async (ctx: Koa.Context, next: Koa.Next) => {
      const { runtimeConfig, hasBeenUpdated } = await getRuntimeConfig("GQL_ENDPOINT"); // IRuntimeConfigGql

      if (runtimeConfig.disabled === true || ctx.request.path !== (runtimeConfig.playgroundPath || "/playground")) {
        return next();
      }

      if (playgroundMiddleware == null || hasBeenUpdated === true) {
        const defaultMiddlewareOptions: MiddlewareOptions = {
          endpoint: "/graphql",
          settings: {
            "editor.cursorShape": "line",
            "editor.fontFamily": "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
            "editor.fontSize": 14,
            "editor.reuseHeaders": true,
            "editor.theme": "light",
            "general.betaUpdates": false,
            "request.credentials": "include",
            "tracing.hideTracingResponse": true,
            "tracing.tracingSupported": true,
          },
        };

        playgroundMiddleware = koaPlayground(Object.assign(defaultMiddlewareOptions, runtimeConfig.middlewareConfig));
      }

      return await playgroundMiddleware(ctx, next);
    });
  }
}
