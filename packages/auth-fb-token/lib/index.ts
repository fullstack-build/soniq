import { Service, Inject } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { Config } from "@fullstack-one/config";
import { GraphQl, UserInputError } from "@fullstack-one/graphql";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { Auth, AuthProvider } from "@fullstack-one/auth";
import { FbHelper } from "./fbHelper";

import * as fs from "fs";
import { ORM } from "@fullstack-one/db";

const schema = fs.readFileSync(require.resolve("../schema.gql"), "utf-8");

@Service()
export class AuthFbToken {
  private authFbTokenConfig;
  private emailAuthProvider: AuthProvider;
  private facebookAuthProvider: AuthProvider;

  // DI
  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private auth: Auth;
  private config: Config;
  private fbHelper: FbHelper;
  private orm: ORM;

  constructor(
    @Inject((type) => Auth) auth,
    @Inject((type) => BootLoader) bootLoader,
    @Inject((type) => SchemaBuilder) schemaBuilder,
    @Inject((type) => ORM) orm: ORM,
    @Inject((type) => Config) config,
    @Inject((type) => GraphQl) graphQl,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory
  ) {
    // register package config
    this.authFbTokenConfig = config.registerConfig("AuthFbToken", `${__dirname}/../config`);

    this.emailAuthProvider = auth.createAuthProvider("email");
    this.facebookAuthProvider = auth.createAuthProvider("facebook");

    // DI
    this.loggerFactory = loggerFactory;
    this.auth = auth;
    this.config = config;
    this.orm = orm;

    this.logger = this.loggerFactory.create(this.constructor.name);

    // add to boot loader
    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));

    schemaBuilder.extendSchema(schema);

    graphQl.addResolvers(this.getResolvers());
  }

  private async boot() {
    this.fbHelper = new FbHelper(this.authFbTokenConfig, this.logger);
    return;
  }

  private getResolvers() {
    return {
      "@fullstack-one/auth-fb-token/authenticateFacebookToken": async (obj, args, context, info, params) => {
        if (args.token == null) {
          throw new UserInputError("Token is required");
        }
        const tenant = args.tenant || "default";

        const queryRunner = this.orm.createQueryRunner();

        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const profile = await this.fbHelper.getProfile(args.token);
          const email = profile.email;
          const providerName = "facebook";

          if (profile == null || email == null || profile.id == null) {
            throw new Error("NotificationEmail or id is missing!");
          }

          const authConnector = this.facebookAuthProvider.getAuthConnector();

          let user = await authConnector.findUser(queryRunner, email, tenant);

          if (user.isFake === true) {
            user = await authConnector.findUser(queryRunner, profile.id, tenant);
          }

          if (user.isFake === true) {
            const facebookAuthFactorCreationToken = await this.facebookAuthProvider.create(profile.id, null, true, { oAuthProvider: providerName });
            const emailAuthFactorCreationToken = await this.emailAuthProvider.create(email, email, true, { oAuthProvider: providerName });

            const response = {
              email,
              profile,
              authFactorCreationTokens: {
                facebook: facebookAuthFactorCreationToken,
                email: emailAuthFactorCreationToken
              }
            };

            await queryRunner.commitTransaction();
            return response;
          } else {
            let emailAuthFactorProof = await this.emailAuthProvider.proof(queryRunner, user.userIdentifier, async (authFactor) => {
              return email;
            });
            let facebookAuthFactorProof = await this.facebookAuthProvider.proof(queryRunner, user.userIdentifier, async (authFactor) => {
              return profile.id;
            });

            if (emailAuthFactorProof.isFake === true && facebookAuthFactorProof.isFake === true) {
              throw new Error("All AuthFactors are invalid.");
            }

            let authFactorCreationToken;
            let authFactorProofToken;

            if (emailAuthFactorProof.isFake === true) {
              authFactorProofToken = facebookAuthFactorProof.authFactorProofToken;
              authFactorCreationToken = await this.emailAuthProvider.create(email, email, true, { oAuthProvider: providerName });
            }

            if (facebookAuthFactorProof.isFake === true) {
              authFactorProofToken = emailAuthFactorProof.authFactorProofToken;
              authFactorCreationToken = await this.facebookAuthProvider.create(profile.id, null, true, { oAuthProvider: providerName });
            }

            const userAuthentication = await authConnector.getUserAuthenticationById(queryRunner, user.userAuthenticationId);
            const loginProviderSets = userAuthentication.loginProviderSets;
            if (loginProviderSets.indexOf(providerName) < 0) {
              loginProviderSets.push(providerName);
            }

            if (authFactorCreationToken != null) {
              await authConnector.modifyAuthFactors(
                queryRunner,
                [authFactorProofToken],
                true,
                loginProviderSets,
                null,
                [authFactorCreationToken],
                []
              );

              if (emailAuthFactorProof.isFake === true) {
                emailAuthFactorProof = await this.emailAuthProvider.proof(queryRunner, user.userIdentifier, async (authFactor) => {
                  return email;
                });
              } else {
                facebookAuthFactorProof = await this.facebookAuthProvider.proof(queryRunner, user.userIdentifier, async (authFactor) => {
                  return profile.id;
                });
              }
            }

            const response = {
              email,
              profile,
              authFactorProofTokens: {
                email: emailAuthFactorProof.authFactorProofToken,
                facebook: facebookAuthFactorProof.authFactorProofToken
              }
            };

            await queryRunner.commitTransaction();
            return response;
          }
        } catch (err) {
          try {
            await queryRunner.rollbackTransaction();
          } catch (e) {
            /* don't care */
          }
          this.logger.warn("passport.strategylogin.error", err);
          throw err;
        } finally {
          queryRunner.release();
        }
        /*
        // If the privacy token is not valid, this function will throw an error and we will not proceed any data.
        this.auth.validatePrivacyAgreementAcceptanceToken(args.privacyAgreementAcceptanceToken);

        // Get the facebook profile information.
        const profile = await this.fbHelper.getProfile(args.token);
        const email = profile.email;
        const providerName = "facebookToken";
        const profileId = profile.id;

        // Create an auth-token for login and registration
        return this.auth.createAuthToken(args.privacyAgreementAcceptanceToken, email, providerName, profileId, args.tenant || "default", profile);*/
      }
    };
  }
}
