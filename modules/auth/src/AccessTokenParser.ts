import { Koa } from "@soniq/server";
import { IAuthRuntimeConfig } from "./interfaces";

export class AccessTokenParser {
  private _authRuntimeConfig: IAuthRuntimeConfig;

  public constructor(authConfig: IAuthRuntimeConfig) {
    this._authRuntimeConfig = authConfig;
  }

  public parse(ctx: Koa.Context, next: Koa.Next): Promise<Koa.Next> {
    // Token transfer over auhorization header and query parameter is not allowed for browsers.
    if (ctx.securityContext.isApiClient === true) {
      if (
        this._authRuntimeConfig.tokenQueryParameter != null &&
        ctx.request.query[this._authRuntimeConfig.tokenQueryParameter] != null
      ) {
        ctx.state.accessToken = ctx.request.query[this._authRuntimeConfig.tokenQueryParameter];
        return next();
      }
      if (ctx.request.header.authorization != null && ctx.request.header.authorization.startsWith("Bearer ")) {
        ctx.state.accessToken = ctx.request.header.authorization.slice(7);
        return next();
      }
    }

    const accessToken: string | undefined = ctx.cookies.get(
      this._authRuntimeConfig.cookie.name,
      this._authRuntimeConfig.cookie
    );

    if (accessToken != null) {
      ctx.state.accessToken = accessToken;
    }

    return next();
  }
}
