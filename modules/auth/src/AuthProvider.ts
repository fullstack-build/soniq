import { AuthConnector } from "./AuthConnector";
import {
  IAuthFactorCreation,
  IAuthFactorProof,
  IAuthFactorForProof,
  IProofResponse,
  IAuthFactorForProofResponse,
  IPasswordData,
  ISodiumConfig,
  IAuthRuntimeConfig,
  IAuthFactorMeta,
} from "./interfaces";
import { createConfig, newHash, hashByMeta, generateRandomPassword } from "./crypto";
import uuid = require("uuid");
import { DateTime } from "luxon";
import { SignHelper } from "./SignHelper";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { Logger, PoolClient } from "soniq";

export class AuthProvider {
  private _authConnector: AuthConnector | null = null;
  private _authQueryHelper: AuthQueryHelper | null = null;
  private _signHelper: SignHelper | null = null;
  private _logger: Logger;
  private _authRuntimeConfig: IAuthRuntimeConfig | null;
  public readonly providerName: string;
  public authFactorProofTokenMaxAgeInSeconds: number | null;

  public constructor(
    providerName: string,
    authConnector: AuthConnector | null,
    authQueryHelper: AuthQueryHelper | null,
    signHelper: SignHelper | null,
    logger: Logger,
    authRuntimeConfig: IAuthRuntimeConfig | null,
    authFactorProofTokenMaxAgeInSeconds: number | null = null
  ) {
    this._authConnector = authConnector;
    this._authQueryHelper = authQueryHelper;
    this._signHelper = signHelper;
    this._logger = logger;
    this._authRuntimeConfig = authRuntimeConfig;
    this.providerName = providerName;
    this.authFactorProofTokenMaxAgeInSeconds = authFactorProofTokenMaxAgeInSeconds;
  }

  private async _createRandomAuthFactor(): Promise<{
    authFactor: IAuthFactorForProof;
    passwordData: IPasswordData;
  }> {
    const randomPassword: string = generateRandomPassword();
    const sodiumConfig: ISodiumConfig = createConfig(this.getAuthRuntimeConfig().sodium);
    const passwordData: IPasswordData = await newHash(randomPassword, sodiumConfig);

    const randomTime: string = DateTime.fromMillis(Math.round(Date.now() * Math.random()), { zone: "utc" }).toISO();

    // Create a fake auth-factor
    const authFactor: IAuthFactorForProof = {
      id: uuid.v4(),
      meta: JSON.stringify({ sodiumMeta: passwordData.meta, providerMeta: {} }),
      communicationAddress: null,
      createdAt: randomTime,
      userAuthenticationId: uuid.v4(),
      userId: uuid.v4(),
    };

    return {
      authFactor,
      passwordData,
    };
  }

  // tslint:disable-next-line:prettier
  public async create(
    password: string,
    communicationAddress: string | null = null,
    isProofed: boolean = false,
    providerMeta: unknown = {}
  ): Promise<string> {
    const sodiumConfig: ISodiumConfig = createConfig(this.getAuthRuntimeConfig().sodium);

    const providerSignature: string = this.getSignHelper().getProviderSignature(
      this.getAuthRuntimeConfig().secrets.authProviderHashSignature,
      this.providerName,
      ""
    );

    const passwordData: IPasswordData = await newHash(password + providerSignature, sodiumConfig);

    const authFactorCreation: IAuthFactorCreation = {
      provider: this.providerName,
      communicationAddress,
      isProofed,
      meta: JSON.stringify({ sodiumMeta: passwordData.meta, providerMeta }),
      hash: passwordData.hash,
    };

    return this.getAuthConnector().createAuthFactorCreationToken(authFactorCreation);
  }

  public async proof(
    pgClient: PoolClient,
    userIdentifier: string,
    getPassword: (authFactor: IAuthFactorForProof) => Promise<string | null>
  ): Promise<IProofResponse> {
    const provider: string = this.providerName;
    let authFactor: IAuthFactorForProof;
    let passwordData: IPasswordData;
    let isFake: boolean = false;

    try {
      authFactor = await this.getAuthConnector().getAuthFactorForProof(pgClient, userIdentifier, provider);

      const meta: IAuthFactorMeta = JSON.parse(authFactor.meta);

      const password: string | null = await getPassword(authFactor);

      const providerSignature: string = this.getSignHelper().getProviderSignature(
        this.getAuthRuntimeConfig().secrets.authProviderHashSignature,
        meta.isOldPassword === true ? "local" : provider,
        meta.isOldPassword === true ? authFactor.userId : ""
      );

      passwordData = await hashByMeta(password + providerSignature, meta.sodiumMeta);
    } catch (err) {
      this._logger.trace(`Password proof failed.`);
      const randomAuthFactor: {
        authFactor: IAuthFactorForProof;
        passwordData: IPasswordData;
      } = await this._createRandomAuthFactor();
      authFactor = randomAuthFactor.authFactor;
      passwordData = randomAuthFactor.passwordData;
      isFake = true;

      try {
        await getPassword(authFactor);
      } catch (err) {
        /* Ignore Error: This is only called to spent exactly the same time in case of an error as in case of validation. */
      }
    }

    const authFactorProof: IAuthFactorProof = {
      id: authFactor.id,
      hash: passwordData.hash,
      provider,
      maxAgeInSeconds: this.authFactorProofTokenMaxAgeInSeconds,
    };

    return {
      authFactorProofToken: this.getAuthConnector().createAuthFactorProofToken(authFactorProof),
      isFake,
    };
  }

  /* For anyone who wants to refactor something: 
    Do not use this function inside the proof method.
    If you do, the time for creating a fake auth-factor would be bigger than the time for validating a correct auth-factor.
  */
  public async getAuthFactor(userIdentifier: string): Promise<IAuthFactorForProofResponse> {
    const provider: string = this.providerName;
    let authFactor: IAuthFactorForProof;
    let isFake: boolean = false;

    try {
      await this.getAuthQueryHelper().transaction(async (pgClient: PoolClient) => {
        authFactor = await this.getAuthConnector().getAuthFactorForProof(pgClient, userIdentifier, provider);
      });
    } catch (err) {
      const randomAuthFactor: {
        authFactor: IAuthFactorForProof;
        passwordData: IPasswordData;
      } = await this._createRandomAuthFactor();
      authFactor = randomAuthFactor.authFactor;
      isFake = true;
    }

    return {
      //@ts-ignore TODO: @eugene This is definitive set
      authFactor,
      isFake,
    };
  }

  public getAuthConnector(): AuthConnector {
    if (this._authConnector == null) {
      throw new Error(`AuthConnector has not been initialised yet.`);
    }
    return this._authConnector;
  }

  public getAuthQueryHelper(): AuthQueryHelper {
    if (this._authQueryHelper == null) {
      throw new Error(`AuthQueryHelpe has not been initialised yet.`);
    }
    return this._authQueryHelper;
  }

  public getSignHelper(): SignHelper {
    if (this._signHelper == null) {
      throw new Error(`SignHelper has not been initialised yet.`);
    }
    return this._signHelper;
  }

  public getAuthRuntimeConfig(): IAuthRuntimeConfig {
    if (this._authRuntimeConfig == null) {
      throw new Error(`AuthRuntimeConfig has not been initialised yet.`);
    }
    return this._authRuntimeConfig;
  }

  public _boot(
    authConnector: AuthConnector,
    authQueryHelper: AuthQueryHelper,
    signHelper: SignHelper,
    runtimeConfig: IAuthRuntimeConfig
  ): void {
    this._authConnector = authConnector;
    this._authQueryHelper = authQueryHelper;
    this._signHelper = signHelper;
    this._authRuntimeConfig = runtimeConfig;
  }
}
