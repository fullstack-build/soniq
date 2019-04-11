import { AuthConnector } from "./AuthConnector";
import { IAuthFactorCreation, IAuthFactorProof, IAuthFactorForProof, IProofResponse, IAuthFactorForProofResponse, IPasswordData } from "./interfaces";
import { createConfig, newHash, hashByMeta, generateRandomPassword } from "./crypto";
import uuid = require("uuid");
import { DateTime } from "luxon";
import { SignHelper } from "./signHelper";

export class AuthProvider {
  private authConnector: AuthConnector;
  private signHelper: SignHelper;
  private authFactorProofTokenMaxAgeInSeconds: number = null;
  public authConfig: any;
  public readonly providerName: string;

  // tslint:disable-next-line:prettier
  constructor(providerName: string, authConnector: AuthConnector, signHelper: SignHelper, authConfig: any, authFactorProofTokenMaxAgeInSeconds: number = null) {
    this.authConnector = authConnector;
    this.signHelper = signHelper;
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

  public async proof(userIdentifier: string, getPassword: (authFactor: IAuthFactorForProof) => Promise<string>): Promise<IProofResponse> {
    const provider = this.providerName;
    let authFactor: IAuthFactorForProof;
    let passwordData: IPasswordData;
    let isFake = false;

    try {
      authFactor = await this.authConnector.getAuthFactorForProof(userIdentifier, provider);

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
    You may want to use this function inside the proof method. 
    However, if you do the time spent to create a fake auth-factor would be bigger than validating a correct auth-factor.
    Thus a attacker could detect if an AuthFactor is valid or not by just evaluating the response-time.
  */
  public async getAuthFactor(userIdentifier: string): Promise<IAuthFactorForProofResponse> {
    const provider = this.providerName;
    let authFactor: IAuthFactorForProof;
    let isFake = false;

    try {
      authFactor = await this.authConnector.getAuthFactorForProof(userIdentifier, provider);
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
}
