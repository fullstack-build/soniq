import { AuthConnector } from "./AuthConnector";
import { IAuthFactorCreation, IAuthFactorProof, IAuthFactorForProof, IProofResponse, IAuthFactorForProofResponse, IPasswordData } from "./interfaces";
import { createConfig, newHash, hashByMeta, generateRandomPassword } from "./crypto";
import uuid = require("uuid");
import { DateTime } from "luxon";
import { SignHelper } from "./SignHelper";
import { ORM, PostgresQueryRunner } from "@fullstack-one/db";
import { AuthQueryHelper } from "./AuthQueryHelper";

export class AuthProvider {
  private authConnector: AuthConnector;
  private authQueryHelper: AuthQueryHelper;
  private signHelper: SignHelper;
  private orm: ORM;
  private authFactorProofTokenMaxAgeInSeconds: number = null;
  public authConfig: any;
  public readonly providerName: string;

  constructor(
    providerName: string,
    authConnector: AuthConnector,
    authQueryHelper: AuthQueryHelper,
    signHelper: SignHelper,
    orm: ORM,
    authConfig: any,
    authFactorProofTokenMaxAgeInSeconds: number = null
  ) {
    this.authConnector = authConnector;
    this.authQueryHelper = authQueryHelper;
    this.signHelper = signHelper;
    this.orm = orm;
    this.authConfig = authConfig;
    this.providerName = providerName;
    this.authFactorProofTokenMaxAgeInSeconds = authFactorProofTokenMaxAgeInSeconds;
  }

  private async createRandomAuthFactor(): Promise<{ authFactor: IAuthFactorForProof; passwordData: IPasswordData }> {
    const randomPassword = generateRandomPassword();
    const sodiumConfig = createConfig(this.authConfig.sodium);
    const passwordData = await newHash(randomPassword, sodiumConfig);

    const randomTime = DateTime.fromMillis(Math.round(Date.now() * Math.random()), { zone: "utc" }).toISO();

    // Create a fake auth-factor
    const authFactor = {
      id: uuid.v4(),
      meta: JSON.stringify({ sodiumMeta: passwordData.meta, providerMeta: {} }),
      communicationAddress: null,
      createdAt: randomTime,
      userAuthenticationId: uuid.v4(),
      userId: uuid.v4()
    };

    return {
      authFactor,
      passwordData
    };
  }

  // tslint:disable-next-line:prettier
  public async create(password: string, communicationAddress: string = null, isProofed: boolean = false, providerMeta: any = {}): Promise<string> {
    const sodiumConfig = createConfig(this.authConfig.sodium);

    const providerSignature = this.signHelper.getProviderSignature(this.authConfig.secrets.authProviderHashSignature, this.providerName, "");

    const passwordData: IPasswordData = await newHash(password + providerSignature, sodiumConfig);

    const authFactorCreation: IAuthFactorCreation = {
      provider: this.providerName,
      communicationAddress,
      isProofed,
      meta: JSON.stringify({ sodiumMeta: passwordData.meta, providerMeta }),
      hash: passwordData.hash
    };

    return this.authConnector.createAuthFactorCreationToken(authFactorCreation);
  }

  public async proof(
    queryRunner: PostgresQueryRunner,
    userIdentifier: string,
    getPassword: (authFactor: IAuthFactorForProof) => Promise<string>
  ): Promise<IProofResponse> {
    const provider = this.providerName;
    let authFactor: IAuthFactorForProof;
    let passwordData: IPasswordData;
    let isFake = false;

    try {
      authFactor = await this.authConnector.getAuthFactorForProof(queryRunner, userIdentifier, provider);

      const meta = JSON.parse(authFactor.meta);

      const password = await getPassword(authFactor);

      const providerSignature = this.signHelper.getProviderSignature(
        this.authConfig.secrets.authProviderHashSignature,
        meta.isOldPassword === true ? "local" : provider,
        meta.isOldPassword === true ? authFactor.userId : ""
      );

      passwordData = await hashByMeta(password + providerSignature, meta.sodiumMeta);
    } catch (err) {
      // TODO: Log this
      const randomAuthFactor = await this.createRandomAuthFactor();
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
      maxAgeInSeconds: this.authFactorProofTokenMaxAgeInSeconds
    };

    return {
      authFactorProofToken: this.authConnector.createAuthFactorProofToken(authFactorProof),
      isFake
    };
  }

  /* For anyone who wants to refactor something: 
    Do not use this function inside the proof method.
    If you do, the time for creating a fake auth-factor would be bigger than the time for validating a correct auth-factor.
  */
  public async getAuthFactor(userIdentifier: string): Promise<IAuthFactorForProofResponse> {
    const provider = this.providerName;
    let authFactor: IAuthFactorForProof;
    let isFake = false;

    try {
      await this.authQueryHelper.transaction(async (queryRunner) => {
        authFactor = await this.authConnector.getAuthFactorForProof(queryRunner, userIdentifier, provider);
      });
    } catch (err) {
      const randomAuthFactor = await this.createRandomAuthFactor();
      authFactor = randomAuthFactor.authFactor;
      isFake = true;
    }

    return {
      authFactor,
      isFake
    };
  }

  public getAuthConnector(): AuthConnector {
    return this.authConnector;
  }

  public getAuthQueryHelper(): AuthQueryHelper {
    return this.authQueryHelper;
  }
}
