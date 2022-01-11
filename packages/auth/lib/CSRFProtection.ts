import { sha256 } from "./crypto";
import { URL } from "url";
import { Logger } from "@fullstack-one/logger";

export class CSRFProtection {
  private logger: Logger;
  private authConfig;

  constructor(logger: Logger, authConfig) {
    this.logger = logger;
    this.authConfig = authConfig;
  }

  public async createSecurityContext(ctx, next) {
    ctx.securityContext = {
      isBrowser: true,
      isApiClient: false,
      clientIdentifier: null,
      requestMethod: ctx.request.method.toUpperCase(),
      sameOriginApproved: {
        byReferrer: false,
        byOrigin: false
      }
    };

    // Generate clientIdentifier for refresh-token
    if (ctx.request.ip != null && ctx.request.headers["user-agent"] != null) {
      ctx.securityContext.clientIdentifier = sha256(`${ctx.request.ip}_#_${ctx.request.headers["user-agent"]}`);
    }

    // Check if https is used on production
    if (process.env.NODE_ENV === "production") {
      if (this.authConfig.enforceHttpsOnProduction !== false && ctx.request.protocol !== "https") {
        this.logger.warn("Request rejected: Unsecure requests are not allowed here. Please use HTTPS.", ctx.securityContext);
        return ctx.throw(400, "Unsecure requests are not allowed here. Please use HTTPS.");
      }
    }

    const origin = ctx.request.get("origin");
    const referrer = ctx.request.get("referrer");
    let referrerOrigin = null;

    // Validate same origin policy by origin header
    if (origin != null && origin !== "" && this.authConfig.validOrigins.includes(origin)) {
      ctx.securityContext.sameOriginApproved.byOrigin = true;
    }

    // Validate same origin policy by referrer header
    if (referrer != null && referrer !== "") {
      const referrerUrl = new URL(referrer);
      referrerOrigin = referrerUrl.origin;
      if (referrerOrigin != null && this.authConfig.validOrigins.includes(referrerOrigin)) {
        ctx.securityContext.sameOriginApproved.byReferrer = true;
      }
    }

    // When the request is approved by referrer and by origin header they must match
    if (ctx.securityContext.sameOriginApproved.byReferrer === true && ctx.securityContext.sameOriginApproved.byOrigin === true) {
      if (referrerOrigin !== origin) {
        this.logger.warn("Request rejected: Referrer and origin header are not matching.", ctx.securityContext);
        return ctx.throw(400, "Referrer and origin header are not matching.");
      }
    }

    let isApiClient = false;
    // Check for API-Client by x-api-client header
    if (ctx.request.headers["x-api-client"] != null) {
      if (typeof ctx.request.headers["x-api-client"] === "string" && ctx.request.headers["x-api-client"].toLowerCase().trim() === 'true') {
        isApiClient = true;
      }
      if (ctx.request.headers["x-api-client"] === true) {
        isApiClient = true;
      }
    }

    // Check for API-Client by origin
    if (this.authConfig.apiClientOrigins.indexOf(origin) >= 0) {
      isApiClient = true;
    }

    // If the client is not a browser we don't need to worry about CORS. * OR Cors is disabled by the header
    if (isApiClient) {
      ctx.securityContext.isApiClient = true;
      ctx.securityContext.isBrowser = false;
    }

    return next();
  }
}
