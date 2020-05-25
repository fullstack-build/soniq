import { sha256 } from "./crypto";
import { URL } from "url";
import { Logger } from "soniq";
import { Koa } from "@soniq/server";
import { IAuthRuntimeConfig } from "./interfaces";

export class CSRFProtection {
  private _logger: Logger;
  private _authRuntimeConfig: IAuthRuntimeConfig;

  public constructor(logger: Logger, authConfig: IAuthRuntimeConfig) {
    this._logger = logger;
    this._authRuntimeConfig = authConfig;
  }

  public async createSecurityContext(ctx: Koa.Context, next: Koa.Next): Promise<Koa.Next> {
    ctx.securityContext = {
      isBrowser: true,
      isApiClient: false,
      clientIdentifier: null,
      requestMethod: ctx.request.method.toUpperCase(),
      sameOriginApproved: {
        byReferrer: false,
        byOrigin: false,
      },
    };

    // Generate clientIdentifier for refresh-token
    if (ctx.request.ip != null && ctx.request.headers["user-agent"] != null) {
      ctx.securityContext.clientIdentifier = sha256(`${ctx.request.ip}_#_${ctx.request.headers["user-agent"]}`);
    }

    // Check if https is used on production
    if (process.env.NODE_ENV === "production") {
      if (this._authRuntimeConfig.enforceHttpsOnProduction !== false && ctx.request.protocol !== "https") {
        this._logger.warn(
          "Request rejected: Unsecure requests are not allowed here. Please use HTTPS.",
          ctx.securityContext
        );
        return ctx.throw(400, "Unsecure requests are not allowed here. Please use HTTPS.");
      }
    }

    const origin: string = ctx.request.get("origin");
    const referrer: string = ctx.request.get("referrer");
    let referrerOrigin: string | null = null;

    // Validate same origin policy by origin header
    if (origin != null && origin !== "" && this._authRuntimeConfig.validOrigins.includes(origin)) {
      ctx.securityContext.sameOriginApproved.byOrigin = true;
    }

    // Validate same origin policy by referrer header
    if (referrer != null && referrer !== "") {
      const referrerUrl: URL = new URL(referrer);
      referrerOrigin = referrerUrl.origin;
      if (referrerOrigin != null && this._authRuntimeConfig.validOrigins.includes(referrerOrigin)) {
        ctx.securityContext.sameOriginApproved.byReferrer = true;
      }
    }

    // When the request is approved by referrer and by origin header they must match
    if (
      ctx.securityContext.sameOriginApproved.byReferrer === true &&
      ctx.securityContext.sameOriginApproved.byOrigin === true
    ) {
      if (referrerOrigin !== origin) {
        this._logger.warn("Request rejected: Referrer and origin header are not matching.", ctx.securityContext);
        return ctx.throw(400, "Referrer and origin header are not matching.");
      }
    }

    // If the client is not a browser we don't need to worry about CORS.
    if (this._authRuntimeConfig.apiClientOrigins.indexOf(origin) >= 0) {
      ctx.securityContext.isApiClient = true;
      ctx.securityContext.isBrowser = false;
    }

    return next();
  }
}
