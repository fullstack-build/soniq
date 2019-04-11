import { Service, Inject } from "@fullstack-one/di";
import { DbGeneralPool } from "@fullstack-one/db";
import { Server } from "@fullstack-one/server";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { Config } from "@fullstack-one/config";
import { GraphQl } from "@fullstack-one/graphql";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import * as koaCors from "@koa/cors";
import { getParser } from "./getParser";

import * as fs from "fs";
import { CSRFProtection } from "./CSRFProtection";
import { AuthConnector } from "./AuthConnector";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { AccessTokenParser } from "./AccessTokenParser";
import { PrivacyAgreementAcceptance } from "./PrivacyAgreementAcceptance";
import { AuthProvider } from "./AuthProvider";
import { IAuthFactorForProof, IUserAuthentication, ILoginData } from "./interfaces";
import { DateTime } from "luxon";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./signHelper";

const schema = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

export * from "./SignHelper";
export * from "./interfaces";
export * from "./AuthProviders/AuthProviderEmail";
export * from "./AuthProviders/AuthProviderOAuth";
export * from "./AuthProviders/AuthProviderPassword";
export { AuthProvider, IAuthFactorForProof };

@Service()
export class Auth {
  private authConfig;
  private cryptoFactory: CryptoFactory;
  private signHelper: SignHelper;
  private authConnector: AuthConnector;
  private authQueryHelper: AuthQueryHelper;
  private csrfProtection: CSRFProtection;
  private accessTokenParser: AccessTokenParser;

  // DI
  private logger: ILogger;
  private parserMeta: any = {};
  private privacyAgreementAcceptance: PrivacyAgreementAcceptance;
  private userRegistrationCallback: (userAuthentication: IUserAuthentication) => void;

  constructor(
    @Inject((type) => DbGeneralPool) dbGeneralPool,
    @Inject((type) => Server) server,
    @Inject((type) => SchemaBuilder) schemaBuilder,
    @Inject((type) => Config) config,
    @Inject((type) => GraphQl) graphQl: GraphQl,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory
  ) {
    // register package config
    this.authConfig = config.registerConfig("Auth", `${__dirname}/../config`);

    this.logger = loggerFactory.create(this.constructor.name);

    this.cryptoFactory = new CryptoFactory(this.authConfig.secrets.encryptionKey, this.authConfig.crypto.algorithm);
    this.signHelper = new SignHelper(this.authConfig.secrets.admin, this.cryptoFactory);

    this.authQueryHelper = new AuthQueryHelper(dbGeneralPool, this.logger, this.authConfig, this.cryptoFactory, this.signHelper);
    this.authConnector = new AuthConnector(this.authQueryHelper, this.logger, this.cryptoFactory, this.authConfig);
    this.privacyAgreementAcceptance = new PrivacyAgreementAcceptance(this.authConfig, this.parserMeta, this.logger, this.signHelper);
    this.csrfProtection = new CSRFProtection(this.logger, this.authConfig);
    this.accessTokenParser = new AccessTokenParser(this.authConfig);

    graphQl.addPreQueryHook(this.preQueryHook.bind(this));
    graphQl.addPreMutationCommitHook(this.preMutationCommitHook.bind(this));
    graphQl.addPostMutationCommitHook(this.postMutationHook.bind(this));

    schemaBuilder.extendSchema(schema);

    schemaBuilder.addExtension(
      getParser(
        (key, value) => {
          this.parserMeta[key] = value;
        },
        (key) => {
          return this.parserMeta[key];
        }
      )
    );

    graphQl.addResolvers(this.getResolvers());

    // add migration path
    schemaBuilder.getDbSchemaBuilder().addMigrationPath(`${__dirname}/..`);

    this.addMiddleware(server);
  }

  private addMiddleware(server: Server) {
    const app = server.getApp();
    app.keys = [this.authConfig.secrets.cookie];

    // If app.proxy === true koa will respect x-forwarded headers
    app.proxy = this.authConfig.isServerBehindProxy === true ? true : false;

    // Prevent CSRF
    app.use(this.csrfProtection.createSecurityContext.bind(this.csrfProtection));

    const corsOptions = {
      ...this.authConfig.corsOptions,
      origin: (ctx) => {
        return ctx.request.get("origin");
      }
    };

    // Allow CORS requests
    app.use(koaCors(corsOptions));

    // Parse AccessToken
    app.use(this.accessTokenParser.parse.bind(this.accessTokenParser));
  }

  private async preQueryHook(dbClient, context, authRequired, buildObject) {
    if (
      buildObject.mutation != null &&
      buildObject.mutation.extensions != null &&
      buildObject.mutation.extensions.auth === "REGISTER_USER_MUTATION"
    ) {
      return;
    }

    if (authRequired === true && context.accessToken != null) {
      try {
        await this.authQueryHelper.authenticateTransaction(dbClient, context.accessToken);
      } catch (err) {
        this.logger.trace("authenticateTransaction.failed", err);
        this.deleteAccessTokenCookie(context.ctx);
        throw err;
      }
    }
  }

  private async preMutationCommitHook(dbClient, hookInfo) {
    const mutation = hookInfo.mutationQuery.mutation;

    if (mutation.extensions.auth === "REGISTER_USER_MUTATION") {
      const args = hookInfo.args;

      // Validate PrivacyAgreementAcceptanceToken
      this.privacyAgreementAcceptance.validateRegisterArguments(args);

      // tslint:disable-next-line:prettier
      const loginData = await this.authConnector.createUserAuthentication(dbClient, hookInfo.entityId, args.isActive || true, args.loginProviderSets, args.modifyProviderSets, args.authFactorCreationTokens);
      hookInfo.loginData = loginData;
    }
  }

  private async postMutationHook(hookInfo, context, info, overwriteReturnData) {
    const mutation = hookInfo.mutationQuery.mutation;

    if (mutation.extensions.auth === "REGISTER_USER_MUTATION") {
      if (hookInfo.context != null && hookInfo.context.ctx != null) {
        const returnLoginData = { ...hookInfo.loginData };

        if (hookInfo.context.ctx.securityContext.isBrowser === true) {
          this.setAccessTokenCookie(hookInfo.context.ctx, returnLoginData);

          returnLoginData.accessToken = null;
        }

        overwriteReturnData(returnLoginData);
      }

      const userAuthentication: IUserAuthentication = await this.authConnector.getUserAuthentication(hookInfo.loginData.accessToken);

      this.userRegistrationCallback(userAuthentication);
    }
  }

  private setAccessTokenCookie(ctx: any, loginData: ILoginData) {
    const cookieOptions = {
      ...this.authConfig.cookie,
      maxAge: loginData.tokenMeta.accessTokenMaxAgeInSeconds * 1000
    };

    ctx.cookies.set(this.authConfig.cookie.name, loginData.accessToken, cookieOptions);
  }

  private deleteAccessTokenCookie(ctx: any) {
    ctx.cookies.set(this.authConfig.cookie.name, null);
    ctx.cookies.set(`${this.authConfig.cookie.name}.sig`, null);
  }

  private getResolvers() {
    return {
      "@fullstack-one/auth/getUserIdentifier": async (obj, args, context, info, params) => {
        return (await this.authConnector.findUser(args.username, args.tenant || null)).userIdentifier;
      },
      "@fullstack-one/auth/login": async (obj, args, context, info, params) => {
        const clientIdentifier = context.ctx.securityContext.clientIdentifier;

        const loginData = await this.authConnector.login(args.authFactorProofTokens, clientIdentifier || null);

        if (context.ctx.securityContext.isBrowser === true) {
          this.setAccessTokenCookie(context.ctx, loginData);

          loginData.accessToken = null;
        }
        return loginData;
      },
      "@fullstack-one/auth/modifyAuthFactors": async (obj, args, context, info, params) => {
        // tslint:disable-next-line:prettier
        await this.authConnector.modifyAuthFactors(args.authFactorProofTokens, args.isActive, args.loginProviderSets, args.modifyProviderSets, args.authFactorCreationTokens, args.removeAuthFactorIds);
        return true;
      },
      "@fullstack-one/auth/proofAuthFactor": async (obj, args, context, info, params) => {
        await this.authConnector.proofAuthFactor(args.authFactorProofToken);
        return true;
      },
      "@fullstack-one/auth/invalidateAccessToken": async (obj, args, context, info, params) => {
        this.deleteAccessTokenCookie(context.ctx);
        await this.authConnector.invalidateAccessToken(context.accessToken);
        return true;
      },
      "@fullstack-one/auth/invalidateAllAccessTokens": async (obj, args, context, info, params) => {
        this.deleteAccessTokenCookie(context.ctx);
        await this.authConnector.invalidateAllAccessTokens(context.accessToken);
        return true;
      },
      "@fullstack-one/auth/refreshAccessToken": async (obj, args, context, info, params) => {
        const clientIdentifier = context.ctx.securityContext.clientIdentifier;

        const loginData = await this.authConnector.refreshAccessToken(context.accessToken, clientIdentifier || null, args.refreshToken);

        if (context.ctx.securityContext.isBrowser === true) {
          this.setAccessTokenCookie(context.ctx, loginData);

          loginData.accessToken = null;
        }
        return loginData;
      },
      "@fullstack-one/auth/createPrivacyAgreementAcceptanceToken": async (obj, args, context, info, params) => {
        return this.privacyAgreementAcceptance.createPrivacyAgreementAcceptanceToken(args.acceptedVersion);
      },
      "@fullstack-one/auth/getTokenMeta": async (obj, args, context, info, params) => {
        try {
          const tokenMeta = await this.authConnector.getTokenMeta(context.accessToken);
          return tokenMeta;
        } catch (err) {
          this.deleteAccessTokenCookie(context.ctx);
          throw err;
        }
      },
      "@fullstack-one/auth/getUserAuthentication": async (obj, args, context, info, params) => {
        return this.authConnector.getUserAuthentication(context.accessToken);
      }
    };
  }

  public getPrivacyAgreementAcceptance(): PrivacyAgreementAcceptance {
    return this.privacyAgreementAcceptance;
  }

  public registerUserRegistrationCallback(callback: (userAuthentication: IUserAuthentication) => void) {
    if (this.userRegistrationCallback != null) {
      throw new Error("Auth 'registerUserRegistrationCallback' can only be called once.");
    }
    this.userRegistrationCallback = callback;
  }

  public createAuthProvider(providerName: string, authFactorProofTokenMaxAgeInSeconds: number = null): AuthProvider {
    return new AuthProvider(providerName, this.authConnector, this.signHelper, this.authConfig, authFactorProofTokenMaxAgeInSeconds);
  }
}
