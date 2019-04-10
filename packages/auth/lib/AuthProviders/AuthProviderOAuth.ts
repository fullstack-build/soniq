import { Service, Inject } from "@fullstack-one/di";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { GraphQl } from "@fullstack-one/graphql";
import { Auth, AuthProvider } from "..";
import { Server } from "@fullstack-one/server";
import { Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import * as KoaRouter from "koa-router";
import * as koaBody from "koa-bodyparser";
import * as koaSession from "koa-session";
import * as passport from "koa-passport";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { PrivacyAgreementAcceptance } from "../PrivacyAgreementAcceptance";

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <script>
  function go() {
    var data = <%=data%>;

    for(var i in data.origins) {
      try {
        window.opener.postMessage(data.message, data.origins[i]);
      } catch(e) {}
    }
    window.close();
  }

  window.onload = go;
  </script>
  <title>Authetication</title>
</head>
<body>
  <h1>This Page requires Javascript.</h1>
</body>
</html>`;

const oAuthCallback = (message, origins) => {
  const data = {
    message,
    origins
  };

  return template.replace("<%=data%>", JSON.stringify(data));
};

@Service()
export class AuthProviderOAuth {
  private emailAuthProvider: AuthProvider;
  private oAuthAuthProviders: { [key: string]: AuthProvider } = {};

  private server: Server;
  private logger: ILogger;

  private authConfig;
  private privacyAgreementAcceptance: PrivacyAgreementAcceptance;

  constructor(
    @Inject((type) => SchemaBuilder) schemaBuilder: SchemaBuilder,
    @Inject((type) => GraphQl) graphQl: GraphQl,
    @Inject((type) => Auth) auth: Auth,
    @Inject((type) => Server) server: Server,
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => Config) config: Config,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory
  ) {
    this.server = server;
    this.authConfig = config.getConfig("Auth");
    this.logger = loggerFactory.create("OAuthAuthProvider");
    this.privacyAgreementAcceptance = auth.getPrivacyAgreementAcceptance();

    this.emailAuthProvider = auth.createAuthProvider("email");

    Object.keys(this.authConfig.oAuth.providers).forEach((key) => {
      this.oAuthAuthProviders[key] = auth.createAuthProvider(key);
    });

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot() {
    const authRouter = new KoaRouter();
    const app = this.server.getApp();

    authRouter.use(koaBody());

    app.keys = [this.authConfig.secrets.cookie];
    authRouter.use(koaSession(this.authConfig.oAuth.cookie, app));

    authRouter.use(passport.initialize());

    authRouter.get("/auth/oAuthFailure", async (ctx) => {
      const message = {
        err: "ERROR_AUTH",
        data: null
      };

      ctx.body = oAuthCallback(message, this.authConfig.oAuth.frontendOrigins);
    });

    authRouter.get("/auth/oAuthFailure/:err", async (ctx) => {
      const message = {
        err: ctx.params.err,
        data: null
      };

      ctx.body = oAuthCallback(message, this.authConfig.oAuth.frontendOrigins);
    });

    authRouter.get("/auth/oAuthSuccess/:data", async (ctx) => {
      const message = {
        err: null,
        data: JSON.parse(ctx.params.data)
      };

      ctx.body = oAuthCallback(message, this.authConfig.oAuth.frontendOrigins);
    });

    Object.keys(this.authConfig.oAuth.providers).forEach((key) => {
      const provider = this.authConfig.oAuth.providers[key];
      const callbackPath = `/auth/oAuthCallback/${key}`;
      const serverApiAddress = this.authConfig.oAuth.serverApiAddress;
      const callbackURL = serverApiAddress + callbackPath;
      const providerConfig = { ...provider.config, callbackURL };

      const providerOptions = { scope: ["email"], ...provider.options, session: false };

      passport.use(
        new provider.strategy(providerConfig, async (accessToken, refreshToken, profile, cb) => {
          try {
            let email = profile.email || profile._json.email;
            if (email == null && profile.emails != null && profile.emails[0] != null && profile.emails[0].value != null) {
              email = profile.emails[0].value;
            }

            if (profile == null || email == null || profile.id == null) {
              throw new Error("NotificationEmail or id is missing!");
            }

            const oAuthAuthProvider = this.oAuthAuthProviders[key];
            const authConnector = oAuthAuthProvider.getAuthConnector();

            let user = await authConnector.findUser(email, provider.tenant);

            if (user.isFake === true) {
              user = await authConnector.findUser(profile.id, provider.tenant);
            }

            if (user.isFake === true) {
              const oAuthAuthFactorCreationToken = await oAuthAuthProvider.create(profile.id, null, true, { oAuthProvider: key });
              const emailAuthFactorCreationToken = await this.emailAuthProvider.create(email, email, true, { oAuthProvider: key });

              const response = {
                email,
                profile,
                authFactorCreationTokens: {
                  oAuth: oAuthAuthFactorCreationToken,
                  email: emailAuthFactorCreationToken
                }
              };

              cb(null, response);
            } else {
              let emailAuthFactorProof = await this.emailAuthProvider.proof(user.userIdentifier, async (authFactor) => {
                return email;
              });
              let oAuthAuthFactorProof = await oAuthAuthProvider.proof(user.userIdentifier, async (authFactor) => {
                return profile.id;
              });

              if (emailAuthFactorProof.isFake === true && oAuthAuthFactorProof.isFake === true) {
                throw new Error("All AuthFactors are invalid.");
              }

              let authFactorCreationToken;
              let authFactorProofToken;

              if (emailAuthFactorProof.isFake === true) {
                authFactorProofToken = oAuthAuthFactorProof.authFactorProofToken;
                authFactorCreationToken = await this.emailAuthProvider.create(email, email, true, { oAuthProvider: key });
              }

              if (oAuthAuthFactorProof.isFake === true) {
                authFactorProofToken = emailAuthFactorProof.authFactorProofToken;
                authFactorCreationToken = await oAuthAuthProvider.create(profile.id, null, true, { oAuthProvider: key });
              }

              const userAuthentication = await authConnector.getUserAuthenticationById(user.userAuthenticationId);
              const loginProviderSets = userAuthentication.loginProviderSets;
              if (loginProviderSets.indexOf(key) < 0) {
                loginProviderSets.push(key);
              }

              if (authFactorCreationToken != null) {
                await authConnector.modifyAuthFactors([authFactorProofToken], true, loginProviderSets, null, [authFactorCreationToken], []);

                if (emailAuthFactorProof.isFake === true) {
                  emailAuthFactorProof = await this.emailAuthProvider.proof(user.userIdentifier, async (authFactor) => {
                    return email;
                  });
                } else {
                  oAuthAuthFactorProof = await oAuthAuthProvider.proof(user.userIdentifier, async (authFactor) => {
                    return profile.id;
                  });
                }
              }

              const response = {
                email,
                profile,
                authFactorProofTokens: {
                  email: emailAuthFactorProof.authFactorProofToken,
                  oAuth: oAuthAuthFactorProof.authFactorProofToken
                }
              };

              cb(null, response);
            }
          } catch (err) {
            this.logger.warn("passport.strategylogin.error", err);
            cb(err);
          }
        })
      );

      authRouter.get(
        `/auth/oAuth/${key}`,
        (ctx, next) => {
          const { queryParameter } = this.authConfig.privacyAgreementAcceptance;

          if (this.privacyAgreementAcceptance.isPrivacyAgreementCheckActive() === true) {
            if (ctx.request.query == null || ctx.request.query[queryParameter] == null) {
              this.logger.warn("passport.oAuthFailure.error.missingPrivacyAgreementAcceptanceToken");
              return ctx.redirect(`/auth/oAuthFailure/${encodeURIComponent(`Missing privacy token query parameter. '${queryParameter}'`)}`);
            }
            try {
              this.privacyAgreementAcceptance.validatePrivacyAgreementAcceptanceToken(ctx.request.query[queryParameter]);
            } catch (err) {
              this.logger.warn("passport.oAuthFailure.error.invalidPrivacyAgreementAcceptanceToken", err);
              return ctx.redirect(`/auth/oAuthFailure/${encodeURIComponent(err.message)}`);
            }
          }
          next();
        },
        passport.authenticate(key, providerOptions)
      );

      const errorCatcher = async (ctx, next) => {
        try {
          await next();
        } catch (err) {
          this.logger.warn("passport.oAuthFailure.error", err);
          ctx.redirect("/auth/oAuthFailure");
        }
      };

      authRouter.get(callbackPath, errorCatcher, passport.authenticate(key, { failureRedirect: "/auth/oAuthFailure", session: false }), (ctx) => {
        ctx.redirect(`/auth/oAuthSuccess/${encodeURIComponent(JSON.stringify(ctx.state.user))}`);
      });
    });

    app.use(authRouter.routes());
    app.use(authRouter.allowedMethods());
  }
}
