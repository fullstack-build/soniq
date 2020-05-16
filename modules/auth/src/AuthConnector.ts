/* eslint-disable @rushstack/no-null */
import { PoolClient, Logger, QueryResult } from "soniq";
import { CryptoFactory } from "./CryptoFactory";
import * as uuid from "uuid";
import { AuthQueryHelper } from "./AuthQueryHelper";
import { DateTime } from "luxon";
import { UserInputError } from "@soniq/graphql";
import {
  IAuthFactorProof,
  IAuthFactorCreation,
  IUserIdentifierObject,
  ILoginData,
  IFindUserResponse,
  IAuthFactorForProof,
  ITokenMeta,
  IUserAuthentication,
  ILoginResult,
  IValidateAccessTokenResult,
  IAuthRuntimeConfig,
} from "./interfaces";
import { Encoder } from "./Encoder";

export class AuthConnector {
  private _logger: Logger;
  private _authRuntimeConfig: IAuthRuntimeConfig;
  private _cryptoFactory: CryptoFactory;
  private _authQueryHelper: AuthQueryHelper;
  private _encoder: Encoder = new Encoder();

  public constructor(
    authQueryHelper: AuthQueryHelper,
    logger: Logger,
    cryptoFactory: CryptoFactory,
    authConfig: IAuthRuntimeConfig
  ) {
    this._authRuntimeConfig = authConfig;
    this._logger = logger;
    this._authQueryHelper = authQueryHelper;
    this._cryptoFactory = cryptoFactory;
  }

  private _encryptAuthFactorProofToken(authFactorProof: IAuthFactorProof): string {
    if (authFactorProof.provider == null || typeof authFactorProof.provider !== "string") {
      throw new Error("Field 'provider' is required for creating AuthFactorProofTokens.");
    }

    authFactorProof.issuedAt = Date.now();
    authFactorProof.maxAgeInSeconds =
      authFactorProof.maxAgeInSeconds != null && Number.isInteger(authFactorProof.maxAgeInSeconds)
        ? authFactorProof.maxAgeInSeconds
        : this._authRuntimeConfig.authFactorProofTokenMaxAgeInSeconds;

    authFactorProof.hash = this._encoder.hexToString(authFactorProof.hash);

    return this._cryptoFactory.encrypt(JSON.stringify(authFactorProof));
  }

  private _decryptAuthFactorProofToken(token: string): IAuthFactorProof {
    const authFactorProof: IAuthFactorProof = JSON.parse(this._cryptoFactory.decrypt(token));

    if (authFactorProof.hash == null) {
      throw new UserInputError(`Invalid AuthFactorProofToken. 'hash' is missing. Possible EncryptionKey leak!`);
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
    if (authFactorProof.maxAgeInSeconds == null) {
      throw new UserInputError(
        "Invalid AuthFactorProofToken. 'maxAgeInSeconds' is missing. Possible EncryptionKey leak!"
      );
    }
    const expirationDateAsTimeStamp: number = authFactorProof.issuedAt + authFactorProof.maxAgeInSeconds * 1000;

    if (expirationDateAsTimeStamp < Date.now()) {
      throw new UserInputError("Expired AuthFactorProofToken.");
    }

    authFactorProof.hash = this._encoder.stringToHex(authFactorProof.hash);

    return authFactorProof;
  }

  private _encryptAuthFactorCreationToken(authFactorCreation: IAuthFactorCreation): string {
    authFactorCreation.isProofed = authFactorCreation.isProofed === true ? true : false;

    authFactorCreation.hash = this._encoder.hexToString(authFactorCreation.hash);

    return this._cryptoFactory.encrypt(JSON.stringify(authFactorCreation));
  }

  private _decryptAuthFactorCreationToken(token: string): IAuthFactorCreation {
    let authFactorCreation: IAuthFactorCreation;

    try {
      authFactorCreation = JSON.parse(this._cryptoFactory.decrypt(token));
    } catch (e) {
      throw new UserInputError("Invalid AuthFactorCreationToken. Decrypt and parse failed.");
    }

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

    try {
      authFactorCreation.hash = this._encoder.stringToHex(authFactorCreation.hash);
    } catch (e) {
      throw new UserInputError("Invalid AuthFactorCreationToken. Invalid hash.");
    }

    return authFactorCreation;
  }

  private _encryptUserIdentifier(userIdentifierObject: IUserIdentifierObject): string {
    userIdentifierObject.issuedAt = Date.now();
    return this._cryptoFactory.encrypt(JSON.stringify(userIdentifierObject));
  }

  private _decryptUserIdentifier(token: string): IUserIdentifierObject {
    const userIdentifierObject: IUserIdentifierObject = JSON.parse(this._cryptoFactory.decrypt(token));

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
    if (userIdentifierObject.issuedAt + this._authRuntimeConfig.userIdentifierMaxAgeInSeconds * 1000 < Date.now()) {
      throw new UserInputError("Expired UserIdentifier.");
    }

    return userIdentifierObject;
  }

  private async _getUserIdentifier(
    pgClient: PoolClient,
    username: string,
    tenant: string
  ): Promise<IUserIdentifierObject> {
    const values: string[] = [username, tenant];
    const queryResult: QueryResult = await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.find_user($1, $2) AS payload",
      values
    );

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
    const authFactorCreations: IAuthFactorCreation[] = authFactorCreationTokens.map(
      this._decryptAuthFactorCreationToken.bind(this)
    );

    await this._authQueryHelper.setAdmin(pgClient);

    const values: unknown[] = [
      userId,
      isActive,
      loginProviderSets,
      modifyProviderSets,
      JSON.stringify(authFactorCreations),
    ];
    const { rows } = await pgClient.query(
      `SELECT _auth.create_user_authentication($1, $2, $3, $4, $5) AS payload;`,
      values
    );

    await this._authQueryHelper.unsetAdmin(pgClient);

    if (rows.length < 1 || rows[0].payload == null || rows[0].payload.userAuthenticationId == null) {
      throw new Error("Incorrect response from create_user_authentication.");
    }

    const result: IUserIdentifierObject = rows[0].payload;

    return result.userAuthenticationId;
  }

  public createAuthFactorCreationToken(authFactorCreation: IAuthFactorCreation): string {
    return this._encryptAuthFactorCreationToken(authFactorCreation);
  }

  public createAuthFactorProofToken(authFactorProof: IAuthFactorProof): string {
    return this._encryptAuthFactorProofToken(authFactorProof);
  }

  public async findUser(pgClient: PoolClient, username: string, tenant: string): Promise<IFindUserResponse> {
    let userIdentifierObject: IUserIdentifierObject | null = null;
    let isFake: boolean = false;

    try {
      userIdentifierObject = await this._getUserIdentifier(pgClient, username, tenant);
    } catch (err) {
      /* Ignore Error */
    }

    // This function will always return some encrypted IDs
    if (
      userIdentifierObject == null ||
      userIdentifierObject.userAuthenticationId == null ||
      userIdentifierObject.authFactorId == null
    ) {
      isFake = true;
      userIdentifierObject = {
        userAuthenticationId: uuid.v4(),
        authFactorId: uuid.v4(),
      };
    }

    return {
      ...userIdentifierObject,
      userIdentifier: this._encryptUserIdentifier(userIdentifierObject),
      isFake,
    };
  }

  public async getAuthFactorForProof(
    pgClient: PoolClient,
    userIdentifierToken: string,
    provider: string
  ): Promise<IAuthFactorForProof> {
    const userIdentifierObject: IUserIdentifierObject = this._decryptUserIdentifier(userIdentifierToken);
    const values: unknown[] = [userIdentifierObject.userAuthenticationId, provider];
    const result: QueryResult = await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.get_auth_factor_for_proof($1, $2) AS payload",
      values
    );

    if (result.rowCount < 1 || result.rows[0].payload == null) {
      throw new Error("AuthFactor not found!");
    }

    return result.rows[0].payload;
  }

  public async login(
    pgClient: PoolClient,
    authFactorProofTokens: string[],
    clientIdentifier: string | null = null
  ): Promise<ILoginData> {
    const authFactorProofs: IAuthFactorProof[] = authFactorProofTokens.map(
      this._decryptAuthFactorProofToken.bind(this)
    );
    const values: unknown[] = [JSON.stringify(authFactorProofs), clientIdentifier];
    const queryResult: QueryResult = await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.login($1, $2) AS payload;",
      values
    );

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Login failed!");
    }

    const result: ILoginResult = queryResult.rows[0].payload;
    const issuedAtLuxon: DateTime = DateTime.fromMillis(result.issuedAt, {
      zone: "UTC",
    });

    const loginData: ILoginData = {
      accessToken: this._cryptoFactory.encrypt(result.accessToken),
      refreshToken: result.refreshToken != null ? this._cryptoFactory.encrypt(result.refreshToken) : null,
      tokenMeta: {
        userId: result.userId,
        providerSet: result.providerSet,
        issuedAt: issuedAtLuxon.toISO(),
        expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
        accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds,
      },
    };

    return loginData;
  }

  public async getTokenMeta(pgClient: PoolClient, accessToken: string): Promise<ITokenMeta> {
    const values: unknown[] = [this._cryptoFactory.decrypt(accessToken)];
    const queryResult: QueryResult = await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.validate_access_token($1) AS payload;",
      values
    );

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Token invalid!");
    }

    const result: IValidateAccessTokenResult = queryResult.rows[0].payload;
    const issuedAtLuxon: DateTime = DateTime.fromMillis(result.issuedAt, {
      zone: "UTC",
    });

    const tokenMeta: ITokenMeta = {
      userId: result.userId,
      providerSet: result.providerSet,
      issuedAt: issuedAtLuxon.toISO(),
      expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
      accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds,
    };

    return tokenMeta;
  }

  public async proofAuthFactor(pgClient: PoolClient, authFactorProofToken: string): Promise<void> {
    const authFactorProof: IAuthFactorProof = this._decryptAuthFactorProofToken(authFactorProofToken);
    const values: unknown[] = [JSON.stringify(authFactorProof)];
    await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.proof_auth_factor($1) AS payload",
      values
    );
  }

  public async refreshAccessToken(
    pgClient: PoolClient,
    accessToken: string,
    clientIdentifier: string,
    refreshToken: string
  ): Promise<ILoginData> {
    const values: unknown[] = [
      this._cryptoFactory.decrypt(accessToken),
      clientIdentifier,
      this._cryptoFactory.decrypt(refreshToken),
    ];
    const queryResult: QueryResult = await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.refresh_access_token($1, $2, $3) AS payload;",
      values
    );

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Refresh failed. Return payload is null");
    }

    const result: ILoginResult = queryResult.rows[0].payload;
    const issuedAtLuxon: DateTime = DateTime.fromMillis(result.issuedAt, {
      zone: "UTC",
    });

    const loginData: ILoginData = {
      accessToken: this._cryptoFactory.encrypt(result.accessToken),
      refreshToken: result.refreshToken != null ? this._cryptoFactory.encrypt(result.refreshToken) : null,
      tokenMeta: {
        userId: result.userId,
        providerSet: result.providerSet,
        issuedAt: issuedAtLuxon.toISO(),
        expiresAt: issuedAtLuxon.plus({ seconds: result.accessTokenMaxAgeInSeconds }).toISO(),
        accessTokenMaxAgeInSeconds: result.accessTokenMaxAgeInSeconds,
      },
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
    const authFactorProofs: IAuthFactorProof[] = authFactorProofTokens.map(
      this._decryptAuthFactorProofToken.bind(this)
    );
    // tslint:disable-next-line:prettier
    const authFactorCreations: IAuthFactorCreation[] =
      authFactorCreationTokens != null
        ? authFactorCreationTokens.map(this._decryptAuthFactorCreationToken.bind(this))
        : [];

    const values: unknown[] = [];
    values.push(JSON.stringify(authFactorProofs));
    values.push(isActive);
    values.push(loginProviderSets);
    values.push(modifyProviderSets);
    values.push(authFactorCreations == null ? null : JSON.stringify(authFactorCreations));
    values.push(removeAuthFactorIds);

    await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      `SELECT _auth.modify_user_authentication($1, $2, $3, $4, $5, $6);`,
      values
    );
  }

  public async getUserAuthentication(pgClient: PoolClient, accessToken: string): Promise<IUserAuthentication> {
    const values: unknown[] = [this._cryptoFactory.decrypt(accessToken)];
    const queryResult: QueryResult = await this._authQueryHelper.adminQueryWithPgClient(
      pgClient,
      "SELECT _auth.get_user_authentication($1) AS payload;",
      values
    );

    if (queryResult.rowCount < 1 || queryResult.rows[0].payload == null) {
      throw new Error("Request invalid.");
    }

    return queryResult.rows[0].payload;
  }

  public async getUserAuthenticationById(
    pgClient: PoolClient,
    userAuthenticationId: string
  ): Promise<IUserAuthentication> {
    const values: unknown[] = [userAuthenticationId];
    const queryResult: QueryResult = await this._authQueryHelper.adminQueryWithPgClient(
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
    const values: unknown[] = [this._cryptoFactory.decrypt(accessToken)];
    try {
      await this._authQueryHelper.adminQueryWithPgClient(pgClient, "SELECT _auth.invalidate_access_token($1);", values);
    } catch (err) {
      /* Igonre Error */
    }
  }

  public async invalidateAllAccessTokens(pgClient: PoolClient, accessToken: string): Promise<void> {
    const values: unknown[] = [this._cryptoFactory.decrypt(accessToken)];
    try {
      await this._authQueryHelper.adminQueryWithPgClient(
        pgClient,
        "SELECT _auth.invalidate_all_access_tokens($1);",
        values
      );
    } catch (err) {
      /* Igonre Error */
    }
  }
}
