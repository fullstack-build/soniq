/* eslint-disable @typescript-eslint/no-explicit-any */
import { Koa } from "@soniq/server";

export class AccessTokenParser {
  private _authConfig: any;

  public constructor(authConfig: any) {
    this._authConfig = authConfig;
  }

  public parse(ctx: Koa.Context, next: Koa.Next): Promise<Koa.Next> {
    // Token transfer over auhorization header and query parameter is not allowed for browsers.
    if (ctx.securityContext.isApiClient === true) {
      if (
        this._authConfig.tokenQueryParameter != null &&
        ctx.request.query[this._authConfig.tokenQueryParameter] != null
      ) {
        ctx.state.accessToken = ctx.request.query[this._authConfig.tokenQueryParameter];
        return next();
      }
      if (ctx.request.header.authorization != null && ctx.request.header.authorization.startsWith("Bearer ")) {
        ctx.state.accessToken = ctx.request.header.authorization.slice(7);
        return next();
      }
    }

    const accessToken: string | undefined = ctx.cookies.get(this._authConfig.cookie.name, this._authConfig.cookie);

    if (accessToken != null) {
      ctx.state.accessToken = accessToken;
    }

    return next();
  }
}
