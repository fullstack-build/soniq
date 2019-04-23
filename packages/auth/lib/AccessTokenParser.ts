export class AccessTokenParser {
  private authConfig;

  constructor(authConfig) {
    this.authConfig = authConfig;
  }

  public parse(ctx, next) {
    // Token transfer over auhorization header and query parameter is not allowed for browsers.
    if (ctx.securityContext.isApiClient === true) {
      if (this.authConfig.tokenQueryParameter != null && ctx.request.query[this.authConfig.tokenQueryParameter] != null) {
        ctx.state.accessToken = ctx.request.query[this.authConfig.tokenQueryParameter];
        return next();
      }
      if (ctx.request.header.authorization != null && ctx.request.header.authorization.startsWith("Bearer ")) {
        ctx.state.accessToken = ctx.request.header.authorization.slice(7);
        return next();
      }
    }

    const accessToken = ctx.cookies.get(this.authConfig.cookie.name, this.authConfig.cookie);

    if (accessToken != null) {
      ctx.state.accessToken = accessToken;
    }

    return next();
  }
}
