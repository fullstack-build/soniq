import { Koa } from "@soniq/server";
import { IAuthAppConfig } from "./moduleDefinition/interfaces";

export class AccessTokenParser {
  private _appConfig: IAuthAppConfig;

  public constructor(appConfig: IAuthAppConfig) {
    this._appConfig = appConfig;
  }

  public parse(ctx: Koa.Context, next: Koa.Next): Promise<Koa.Next> {
    // Token transfer over auhorization header and query parameter is not allowed for browsers.
    if (ctx.securityContext.isApiClient === true) {
      if (
        this._appConfig.tokenQueryParameter != null &&
        ctx.request.query[this._appConfig.tokenQueryParameter] != null
      ) {
        ctx.state.accessToken = ctx.request.query[this._appConfig.tokenQueryParameter];
        return next();
      }
      if (ctx.request.header.authorization != null && ctx.request.header.authorization.startsWith("Bearer ")) {
        ctx.state.accessToken = ctx.request.header.authorization.slice(7);
        return next();
      }
    }

    const accessToken: string | undefined = ctx.cookies.get(this._appConfig.cookie.name, this._appConfig.cookie);

    if (accessToken != null) {
      ctx.state.accessToken = accessToken;
    }

    return next();
  }
}
