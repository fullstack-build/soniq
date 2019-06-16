import { PgClient } from "@fullstack-one/db";
import { ILogger } from "@fullstack-one/logger";
import { CryptoFactory } from "./CryptoFactory";
import * as uuid from "uuid";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { DateTime } from "luxon";
import { AuthenticationError } from "@fullstack-one/graphql";
import { sha512 } from "./crypto";
import {
  IAuthFactorProof,
  IAuthFactorCreation,
  IUserIdentifierObject,
  ILoginData,
  IFindUserResponse,
  IAuthFactorForProof,
  ITokenMeta,
  IUserAuthentication
} from "./interfaces";
import { Encoder } from "./Encoder";

export class AuthConnector {
  private logger: ILogger;
  private authConfig: any;
  private cryptoFactory: CryptoFactory;
  private authQueryHelper: AuthQueryHelper;
  private encoder: Encoder = new Encoder();

  constructor(authQueryHelper: AuthQueryHelper, logger: ILogger, cryptoFactory: CryptoFactory, authConfig: any) {
    this.authConfig = authConfig;
    this.logger = logger;
    this.authQueryHelper = authQueryHelper;

    this.cryptoFactory = cryptoFactory;
  }

  private encryptAuthFactorProofToken(authFactorProof: IAuthFactorProof): string {
    if (authFactorProof.provider == null || typeof authFactorProof.provider !== "string") {
      throw new Error("Field 'provider' is required for creating AuthFactorProofTokens.");
    }

    authFactorProof.issuedAt = Date.now();
    authFactorProof.maxAgeInSeconds =
      authFactorProof.maxAgeInSeconds != null && Number.isInteger(authFactorProof.maxAgeInSeconds)
        ? authFactorProof.maxAgeInSeconds
        : this.authConfig.authFactorProofTokenMaxAgeInSeconds;

    authFactorProof.hash = this.encoder.hexToString(authFactorProof.hash);

    return this.cryptoFactory.encrypt(JSON.stringify(authFactorProof));
  }

  private decryptAuthFactorProofToken(token: string): IAuthFactorProof {
    const authFactorProof: IAuthFactorProof = JSON.parse(this.cryptoFactory.decrypt(token));

    if (authFactorProof.hash == null) {
      throw new Error("Invalid AuthFactorProofToken. 'hash' is missing. Possible EncryptionKey leak!");
    }
    if (authFactorProof.id == null) {
      throw new Error("Invalid AuthFactorProofToken. 'id' is missing. Possible EncryptionKey leak!");
    }
    if (authFactorProof.provider == null) {
      throw new Error("Invalid AuthFactorProofToken. 'provider' is missing. Possible EncryptionKey leak!");
    }
    if (authFactorProof.issuedAt == null) {
      throw new Error("Invalid AuthFactorProofToken. 'issuedAt' is missing. Possible EncryptionKey leak!");
    }
    // tslint:disable-next-line:prettier
    if (authFactorProof.issuedAt + authFactorProof.maxAgeInSeconds * 1000 < Date.now()) {
      throw new Error("Expired AuthFactorProofToken.");
    }

    authFactorProof.hash = this.encoder.stringToHex(authFactorProof.hash);

    return authFactorProof;
  }

  private encryptAuthFactorCreationToken(authFactorCreation: IAuthFactorCreation): string {
    authFactorCreation.isProofed = authFactorCreation.isProofed === true ? true : false;

    authFactorCreation.hash = this.encoder.hexToString(authFactorCreation.hash);

    return this.cryptoFactory.encrypt(JSON.stringify(authFactorCreation));
  }

  private decryptAuthFactorCreationToken(token: string): IAuthFactorCreation {
    const authFactorCreation: IAuthFactorCreation = JSON.parse(this.cryptoFactory.decrypt(token));

    if (authFactorCreation.hash == null) {
      throw new Error("Invalid AuthFactorCreationToken. 'hash' is missing.");
    }
    if (authFactorCreation.meta == null) {
      throw new Error("Invalid AuthFactorCreationToken. 'meta' is missing.");
    }
    if (authFactorCreation.isProofed == null) {
      throw new Error("Invalid AuthFactorCreationToken. 'isProofed' is missing.");
    }
    if (authFactorCreation.provider == null) {
      throw new Error("Invalid AuthFactorCreationToken. 'provider' is missing.");
    }

    authFactorCreation.hash = this.encoder.stringToHex(authFactorCreation.hash);

    return authFactorCreation;
  }

  private encryptUserIdentifier(userIdentifierObject: IUserIdentifierObject): string {
    userIdentifierObject.issuedAt = Date.now();
    return this.cryptoFactory.encrypt(JSON.stringify(userIdentifierObject));
  }

  private decryptUserIdentifier(token: string): IUserIdentifierObject {
    const userIdentifierObject: IUserIdentifierObject = JSON.parse(this.cryptoFactory.decrypt(token));

    if (userIdentifierObject.userAuthenticationId == null) {
      throw new Error("Invalid UserIdentifier. 'userAuthenticationId' is missing.");
    }
    if (userIdentifierObject.authFactorId == null) {
      throw new Error("Invalid UserIdentifier. 'authFactorId' is missing.");
    }
    if (userIdentifierObject.issuedAt == null) {
      throw new Error("Invalid UserIdentifier. 'issuedAt' is missing.");
    }
    // tslint:disable-next-line:prettier
    if (userIdentifierObject.issuedAt + this.authConfig.userIdentifierMaxAgeInSeconds * 1000 < Date.now()) {
      throw new Error("Expired UserIdentifier.");
    }

    return userIdentifierObject;
  }

  private async getUserIdentifier(username: string, tenant: string): Promise<IUserIdentifierObject> {
    const values = [username, tenant];
    const { rows } = await this.authQueryHelper.adminQuery("SELECT _auth.find_user($1, $2) AS payload", values);

    if (rows.length < 1 || rows[0].payload == null) {
      throw new Error("User not found!");
    }

    return rows[0].payload;
  }

  // tslint:disable-next-line:prettier
  public async createUserAuthentication(
    dbClient: PgClient,
    userId: string,
    isActive: boolean,
    loginProviderSets: string[],
    modifyProviderSets: string[],
    authFactorCreationTokens: string[]
  ): Promise<ILoginData> {
    try {
      const authFactorCreations: IAuthFactorCreation[] = authFactorCreationTokens.map(this.decryptAuthFactorCreationToken.bind(this));

      await this.authQueryHelper.setAdmin(dbClient);

      const values = [userId, isActive, loginProviderSets, modifyProviderSets, JSON.stringify(authFactorCreations)];
      const { rows } = await dbClient.query(`SELECT _auth.create_user_authentication($1, $2, $3, $4, $5) AS payload;`, values);

      await this.authQueryHelper.unsetAdmin(dbClient);

      if (rows.length < 1 || rows[0].payload == null) {
        throw new Error("Incorrect response from create_user_authentication.");
      }

      const result = rows[0].payload;
      const issuedAtLuxon = DateTime.fromMillis(result.issuedAt, { zone: "UTC" });

      const loginData: ILoginData = {
        accessToken: this.cryptoFactory.encrypt(result.accessToken),
        refreshToken: result.refreshToken != null ? this.cryptoFactory.encrypt(result.refreshToken) : null,
        tokenMeta: {
          userId: result.userId,
          providerSet: result.providerSet,
          issuedAt: issuedAtLuxon.toISO(),
          expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
          accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds
        }
      };

      return loginData;
    } catch (err) {
      this.logger.trace("createUserAuthentication.failed", err);
      throw new Error("Create UserAuthentication failed.");
    }
  }

  public createAuthFactorCreationToken(authFactorCreation: IAuthFactorCreation): string {
    return this.encryptAuthFactorCreationToken(authFactorCreation);
  }

  public createAuthFactorProofToken(authFactorProof: IAuthFactorProof): string {
    return this.encryptAuthFactorProofToken(authFactorProof);
  }

  public async findUser(username: string, tenant: string): Promise<IFindUserResponse> {
    let userIdentifierObject: IUserIdentifierObject = null;
    let isFake = false;

    try {
      userIdentifierObject = await this.getUserIdentifier(username, tenant);
    } catch (err) {
      /* Ignore Error */
    }

    // This function will always return some encrypted IDs
    if (userIdentifierObject == null || userIdentifierObject.userAuthenticationId == null || userIdentifierObject.authFactorId == null) {
      isFake = true;
      userIdentifierObject = {
        userAuthenticationId: uuid.v4(),
        authFactorId: uuid.v4()
      };
    }

    return {
      ...userIdentifierObject,
      userIdentifier: this.encryptUserIdentifier(userIdentifierObject),
      isFake
    };
  }

  public async getAuthFactorForProof(userIdentifierToken: string, provider: string): Promise<IAuthFactorForProof> {
    const userIdentifierObject = this.decryptUserIdentifier(userIdentifierToken);
    const values = [userIdentifierObject.userAuthenticationId, provider];
    const { rows } = await this.authQueryHelper.adminQuery("SELECT _auth.get_auth_factor_for_proof($1, $2) AS payload", values);

    if (rows.length < 1 || rows[0].payload == null) {
      throw new Error("AuthFactor not found!");
    }

    return rows[0].payload;
  }

  public async login(authFactorProofTokens: string[], clientIdentifier: string = null): Promise<ILoginData> {
    try {
      const authFactorProofs: IAuthFactorProof[] = authFactorProofTokens.map(this.decryptAuthFactorProofToken.bind(this));
      const values = [JSON.stringify(authFactorProofs), clientIdentifier];
      const { rows } = await this.authQueryHelper.adminQuery("SELECT _auth.login($1, $2) AS payload;", values);

      if (rows.length < 1 || rows[0].payload == null) {
        throw new Error("Login failed!");
      }

      const result = rows[0].payload;
      const issuedAtLuxon = DateTime.fromMillis(result.issuedAt, { zone: "UTC" });

      const loginData: ILoginData = {
        accessToken: this.cryptoFactory.encrypt(result.accessToken),
        refreshToken: result.refreshToken != null ? this.cryptoFactory.encrypt(result.refreshToken) : null,
        tokenMeta: {
          userId: result.userId,
          providerSet: result.providerSet,
          issuedAt: issuedAtLuxon.toISO(),
          expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
          accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds
        }
      };

      return loginData;
    } catch (err) {
      this.logger.trace("login.failed", err);
      throw new Error("Login failed.");
    }
  }

  public async getTokenMeta(accessToken: string): Promise<ITokenMeta> {
    try {
      const values = [this.cryptoFactory.decrypt(accessToken)];
      const { rows } = await this.authQueryHelper.adminQuery("SELECT _auth.validate_access_token($1) AS payload;", values);

      if (rows.length < 1 || rows[0].payload == null) {
        throw new Error("Token invalid!");
      }

      const result = rows[0].payload;
      const issuedAtLuxon = DateTime.fromMillis(result.issuedAt, { zone: "UTC" });

      const tokenMeta: ITokenMeta = {
        userId: result.userId,
        providerSet: result.providerSet,
        issuedAt: issuedAtLuxon.toISO(),
        expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
        accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds
      };

      return tokenMeta;
    } catch (err) {
      this.logger.trace("getTokenMeta.failed", err);
      throw new AuthenticationError("getTokenMeta.failed");
    }
  }

  public async proofAuthFactor(authFactorProofToken: string) {
    const authFactorProof = this.decryptAuthFactorProofToken(authFactorProofToken);
    const values = [JSON.stringify(authFactorProof)];
    await this.authQueryHelper.adminQuery("SELECT _auth.proof_auth_factor($1) AS payload", values);
  }

  public async refreshAccessToken(accessToken: string, clientIdentifier: string, refreshToken: string): Promise<ILoginData> {
    try {
      const values = [this.cryptoFactory.decrypt(accessToken), clientIdentifier, this.cryptoFactory.decrypt(refreshToken)];
      const { rows } = await this.authQueryHelper.adminQuery("SELECT _auth.refresh_access_token($1, $2, $3) AS payload;", values);

      if (rows.length < 1 || rows[0].payload == null) {
        throw new Error("Refresh failed!");
      }

      const result = rows[0].payload;
      const issuedAtLuxon = DateTime.fromMillis(result.issuedAt, { zone: "UTC" });

      const loginData: ILoginData = {
        accessToken: this.cryptoFactory.encrypt(result.accessToken),
        refreshToken: result.refreshToken != null ? this.cryptoFactory.encrypt(result.refreshToken) : null,
        tokenMeta: {
          userId: result.userId,
          providerSet: result.providerSet,
          issuedAt: issuedAtLuxon.toISO(),
          expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
          accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds
        }
      };

      return loginData;
    } catch (err) {
      this.logger.trace("refreshAccessToken.failed", err);
      throw new Error("Refresh failed.");
    }
  }

  // tslint:disable-next-line:prettier
  public async modifyAuthFactors(
    authFactorProofTokens: string[],
    isActive: boolean | null,
    loginProviderSets: string[] | null,
    modifyProviderSets: string[] | null,
    authFactorCreationTokens: string[] | null,
    removeAuthFactorIds: string[] | null
  ): Promise<void> {
    try {
      const authFactorProofs: IAuthFactorProof[] = authFactorProofTokens.map(this.decryptAuthFactorProofToken.bind(this));
      // tslint:disable-next-line:prettier
      const authFactorCreations: IAuthFactorCreation[] =
        authFactorCreationTokens != null ? authFactorCreationTokens.map(this.decryptAuthFactorCreationToken.bind(this)) : [];

      const values = [];
      values.push(JSON.stringify(authFactorProofs));
      values.push(isActive);
      values.push(loginProviderSets);
      values.push(modifyProviderSets);
      values.push(authFactorCreations == null ? null : JSON.stringify(authFactorCreations));
      values.push(removeAuthFactorIds);

      await this.authQueryHelper.adminQuery(`SELECT _auth.modify_user_authentication($1, $2, $3, $4, $5, $6);`, values);
    } catch (err) {
      this.logger.trace("modifyAuthFactors.failed", err);
      throw new Error("Modify AuthFactors failed.");
    }
  }

  public async getUserAuthentication(accessToken: string): Promise<IUserAuthentication> {
    try {
      const values = [this.cryptoFactory.decrypt(accessToken)];
      const { rows } = await this.authQueryHelper.adminQuery("SELECT _auth.get_user_authentication($1) AS payload;", values);

      if (rows.length < 1 || rows[0].payload == null) {
        throw new Error("Request invalid.");
      }

      return rows[0].payload;
    } catch (err) {
      this.logger.trace("getUserAuthentication.failed", err);

      throw new Error("Request failed.");
    }
  }

  public async getUserAuthenticationById(userAuthenticationId: string): Promise<IUserAuthentication> {
    try {
      const values = [userAuthenticationId];
      const { rows } = await this.authQueryHelper.adminQuery("SELECT _auth.get_user_authentication_by_id($1) AS payload;", values);

      if (rows.length < 1 || rows[0].payload == null) {
        throw new Error("Request invalid.");
      }

      return rows[0].payload;
    } catch (err) {
      this.logger.trace("getUserAuthentication.failed", err);

      throw new Error("Request failed.");
    }
  }

  public async invalidateAccessToken(accessToken: string): Promise<void> {
    const values = [this.cryptoFactory.decrypt(accessToken)];
    try {
      await this.authQueryHelper.adminQuery("SELECT _auth.invalidate_access_token($1);", values);
    } catch (err) {
      /* Igonre Error */
    }
  }

  public async invalidateAllAccessTokens(accessToken: string): Promise<void> {
    const values = [this.cryptoFactory.decrypt(accessToken)];
    try {
      await this.authQueryHelper.adminQuery("SELECT _auth.invalidate_all_access_tokens($1);", values);
    } catch (err) {
      /* Igonre Error */
    }
  }
}
