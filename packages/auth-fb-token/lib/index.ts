import { Service, Inject } from '@fullstack-one/di';
import { BootLoader } from '@fullstack-one/boot-loader';
import { SchemaBuilder } from '@fullstack-one/schema-builder';
import { Config } from '@fullstack-one/config';
import { GraphQl } from '@fullstack-one/graphql';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { Auth } from '@fullstack-one/auth';
import { FbHelper } from './fbHelper';

import * as fs from 'fs';

const schema = fs.readFileSync(require.resolve('../schema.gql'), 'utf-8');

@Service()
export class AuthFbToken {

  private authFbTokenConfig;

  // DI
  private logger: ILogger;
  private auth: Auth;
  private config: Config;
  private fbHelper: FbHelper;

  constructor(
    @Inject(type => Auth) auth,
    @Inject(type => BootLoader) bootLoader,
    @Inject(type => SchemaBuilder) schemaBuilder,
    @Inject(type => Config) config,
    @Inject(type => GraphQl) graphQl,
    @Inject(type => LoggerFactory) loggerFactory: LoggerFactory
  ) {

    // register package config
    config.addConfigFolder(__dirname + '/../config');

    this.logger = loggerFactory.create('AuthFbToken');

    // DI
    this.auth = auth;
    this.config = config;

    // add to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));

    schemaBuilder.extendSchema(schema);

    graphQl.addResolvers(this.getResolvers());
  }

  private async boot() {
    this.authFbTokenConfig = this.config.getConfig('authFbToken');
    this.fbHelper = new FbHelper(this.authFbTokenConfig, this.logger);
    return;
  }

  private getResolvers() {
    return {
      '@fullstack-one/auth-fb-token/createAuthTokenFromFacebookToken': async (obj, args, context, info, params) => {
        // If the privacy token is not valid, this function will throw an error and we will not proceed any data.
        this.auth.validatePrivacyAgreementAcceptanceToken(args.privacyAgreementAcceptanceToken);

        // Get the facebook profile information.
        const profile = await this.fbHelper.getProfile(args.token);
        const email = profile.email;
        const providerName = 'facebookToken';
        const profileId = profile.id;

        // Create an auth-token for login and registration
        return await this.auth.createAuthToken(args.privacyAgreementAcceptanceToken, email, providerName,
        profileId, args.tenant || 'default', profile);
      }
    };
  }
}
