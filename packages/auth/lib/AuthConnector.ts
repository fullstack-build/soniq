import { PoolClient } from "@fullstack-one/core";
import { ILogger } from "@fullstack-one/logger";
import { CryptoFactory } from "./CryptoFactory";
import * as uuid from "uuid";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { DateTime } from "luxon";
import { AuthenticationError, UserInputError } from "@fullstack-one/graphql";
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
      throw new UserInputError("Invalid AuthFactorProofToken. 'hash' is missing. Possible EncryptionKey leak!");
    }
    if (authFactorProof.id == null) {
      throw new UserInputError("Invalid AuthFactorProofToken. 'id' is missing. Possible EncryptionKey leak!");
    }
    if (authFactorProof.provider == null) {
      throw new UserInputError("Invalid AuthFactorProofToken. 'provider' is missing. Possible EncryptionKey leak!");
    }
    if (authFactorProof.issuedAt == null) {
      throw new UserInputError("Invalid AuthFactorProofToken. 'issuedAt' is missing. Possible EncryptionKey leak!");
    }
    // tslint:disable-next-line:prettier
    if (authFactorProof.issuedAt + authFactorProof.maxAgeInSeconds * 1000 < Date.now()) {
      throw new UserInputError("Expired AuthFactorProofToken.");
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
      throw new UserInputError("Invalid AuthFactorCreationToken. 'hash' is missing.");
    }
    if (authFactorCreation.meta == null) {
      throw new UserInputError("Invalid AuthFactorCreationToken. 'meta' is missing.");
    }
    if (authFactorCreation.isProofed == null) {
      throw new UserInputError("Invalid AuthFactorCreationToken. 'isProofed' is missing.");
    }
    if (authFactorCreation.provider == null) {
      throw new UserInputError("Invalid AuthFactorCreationToken. 'provider' is missing.");
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
      throw new UserInputError("Invalid UserIdentifier. 'userAuthenticationId' is missing.");
    }
    if (userIdentifierObject.authFactorId == null) {
      throw new UserInputError("Invalid UserIdentifier. 'authFactorId' is missing.");
    }
    if (userIdentifierObject.issuedAt == null) {
      throw new UserInputError("Invalid UserIdentifier. 'issuedAt' is missing.");
    }
    // tslint:disable-next-line:prettier
    if (userIdentifierObject.issuedAt + this.authConfig.userIdentifierMaxAgeInSeconds * 1000 < Date.now()) {
      throw new UserInputError("Expired UserIdentifier.");
    }

    return userIdentifierObject;
  }

  private async getUserIdentifier(pgClient: PoolClient, username: string, tenant: string): Promise<IUserIdentifierObject> {
    const values = [username, tenant];
    const queryResult = await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.find_user($1, $2) AS payload", values);

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("User not found!");
    }

    return queryResult.rows[0].payload;
  }

  // tslint:disable-next-line:prettier
  public async createUserAuthentication(
    pgClient: PoolClient,
    userId: string,
    isActive: boolean,
    loginProviderSets: string[],
    modifyProviderSets: string[],
    authFactorCreationTokens: string[]
  ): Promise<string> {
    const authFactorCreations: IAuthFactorCreation[] = authFactorCreationTokens.map(this.decryptAuthFactorCreationToken.bind(this));

    await this.authQueryHelper.setAdmin(pgClient);

    const values = [userId, isActive, loginProviderSets, modifyProviderSets, JSON.stringify(authFactorCreations)];
    const { rows } = await pgClient.query(`SELECT _auth.create_user_authentication($1, $2, $3, $4, $5) AS payload;`, values);

    await this.authQueryHelper.unsetAdmin(pgClient);

    if (rows.length < 1 || rows[0].payload == null || rows[0].payload.userAuthenticationId == null) {
      throw new Error("Incorrect response from create_user_authentication.");
    }

    const result = rows[0].payload;

    return result.userAuthenticationId;
  }

  public createAuthFactorCreationToken(authFactorCreation: IAuthFactorCreation): string {
    return this.encryptAuthFactorCreationToken(authFactorCreation);
  }

  public createAuthFactorProofToken(authFactorProof: IAuthFactorProof): string {
    return this.encryptAuthFactorProofToken(authFactorProof);
  }

  public async findUser(pgClient: PoolClient, username: string, tenant: string): Promise<IFindUserResponse> {
    let userIdentifierObject: IUserIdentifierObject = null;
    let isFake = false;

    try {
      userIdentifierObject = await this.getUserIdentifier(pgClient, username, tenant);
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

  public async getAuthFactorForProof(pgClient: PoolClient, userIdentifierToken: string, provider: string): Promise<IAuthFactorForProof> {
    const userIdentifierObject = this.decryptUserIdentifier(userIdentifierToken);
    const values = [userIdentifierObject.userAuthenticationId, provider];
    const result = await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.get_auth_factor_for_proof($1, $2) AS payload", values);

    if (result.rowCount < 1 || result.rows[0].payload == null) {
      throw new Error("AuthFactor not found!");
    }

    return result.rows[0].payload;
  }

  public async login(pgClient: PoolClient, authFactorProofTokens: string[], clientIdentifier: string = null): Promise<ILoginData> {
    const authFactorProofs: IAuthFactorProof[] = authFactorProofTokens.map(this.decryptAuthFactorProofToken.bind(this));
    const values = [JSON.stringify(authFactorProofs), clientIdentifier];
    const queryResult = await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.login($1, $2) AS payload;", values);

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Login failed!");
    }

    const result = queryResult.rows[0].payload;
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
  }

  public async getTokenMeta(pgClient: PoolClient, accessToken: string): Promise<ITokenMeta> {
    const values = [this.cryptoFactory.decrypt(accessToken)];
    const queryResult = await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.validate_access_token($1) AS payload;", values);

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Token invalid!");
    }

    const result = queryResult.rows[0].payload;
    const issuedAtLuxon = DateTime.fromMillis(result.issuedAt, { zone: "UTC" });

    const tokenMeta: ITokenMeta = {
      userId: result.userId,
      providerSet: result.providerSet,
      issuedAt: issuedAtLuxon.toISO(),
      expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
      accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds
    };

    return tokenMeta;
  }

  public async proofAuthFactor(pgClient: PoolClient, authFactorProofToken: string) {
    const authFactorProof = this.decryptAuthFactorProofToken(authFactorProofToken);
    const values = [JSON.stringify(authFactorProof)];
    await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.proof_auth_factor($1) AS payload", values);
  }

  public async refreshAccessToken(pgClient: PoolClient, accessToken: string, clientIdentifier: string, refreshToken: string): Promise<ILoginData> {
    const values = [this.cryptoFactory.decrypt(accessToken), clientIdentifier, this.cryptoFactory.decrypt(refreshToken)];
    const queryResult = await this.authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.refresh_access_token($1, $2, $3) AS payload;",
      values
    );

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Refresh failed. Return payload is null");
    }

    const result = queryResult.rows[0].payload;
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
  }

  // tslint:disable-next-line:prettier
  public async modifyAuthFactors(
    pgClient: PoolClient,
    authFactorProofTokens: string[],
    isActive: boolean | null,
    loginProviderSets: string[] | null,
    modifyProviderSets: string[] | null,
    authFactorCreationTokens: string[] | null,
    removeAuthFactorIds: string[] | null
  ): Promise<void> {
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

    await this.authQueryHelper.adminQueryWithPgClient(pgClient, `SELECT _auth.modify_user_authentication($1, $2, $3, $4, $5, $6);`, values);
  }

  public async getUserAuthentication(pgClient: PoolClient, accessToken: string): Promise<IUserAuthentication> {
    const values = [this.cryptoFactory.decrypt(accessToken)];
    const queryResult = await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.get_user_authentication($1) AS payload;", values);

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Request invalid.");
    }

    return queryResult.rows[0].payload;
  }

  public async getUserAuthenticationById(pgClient: PoolClient, userAuthenticationId: string): Promise<IUserAuthentication> {
    const values = [userAuthenticationId];
    const queryResult = await this.authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.get_user_authentication_by_id($1) AS payload;",
      values
    );

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Request invalid.");
    }

    return queryResult.rows[0].payload;
  }

  public async invalidateAccessToken(pgClient: PoolClient, accessToken: string): Promise<void> {
    const values = [this.cryptoFactory.decrypt(accessToken)];
    try {
      await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.invalidate_access_token($1);", values);
    } catch (err) {
      /* Igonre Error */
    }
  }

  public async invalidateAllAccessTokens(pgClient: PoolClient, accessToken: string): Promise<void> {
    const values = [this.cryptoFactory.decrypt(accessToken)];
    try {
      await this.authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.invalidate_all_access_tokens($1);", values);
    } catch (err) {
      /* Igonre Error */
    }
  }
}
