/* eslint-disable @typescript-eslint/no-explicit-any */
import { PoolClient, Pool, QueryResult } from "soniq";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsolationLevel = any;
import { Logger } from "soniq";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";
import { AuthenticationError } from "@soniq/graphql";
import { ITransactionAuth } from "./interfaces";

export class AuthQueryHelper {
  private _pgPool: Pool;
  private readonly _logger: Logger;
  private readonly _cryptoFactory: CryptoFactory;
  private readonly _signHelper: SignHelper;
  private _possibleTransactionIsolationLevels: IsolationLevel[] = [
    "SERIALIZABLE",
    "REPEATABLE READ",
    "READ COMMITTED",
    "READ UNCOMMITTED",
  ];

  public constructor(pgPool: Pool, logger: Logger, cryptoFactory: CryptoFactory, signHelper: SignHelper) {
    this._pgPool = pgPool;
    this._logger = logger;
    this._cryptoFactory = cryptoFactory;
    this._signHelper = signHelper;
  }

  private async _createPgClientAdminTransaction(
    pgClient: PoolClient,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<PoolClient> {
    const isolationLevelIndex: number = this._possibleTransactionIsolationLevels.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => isolationLevel.toLowerCase() === item.toLowerCase()
    );
    const isolationLevelToUse: string = this._possibleTransactionIsolationLevels[isolationLevelIndex];

    await pgClient.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevelToUse};`);
    await this.setAdmin(pgClient);
    return pgClient;
  }

  public async getCurrentUserIdFromClient(pgClient: PoolClient): Promise<string> {
    return (await pgClient.query("SELECT _auth.current_user_id();"))[0].current_user_id;
  }

  public async getCurrentUserIdFromAccessToken(accessToken: string): Promise<string> {
    return this.transaction(
      async (pgClient: PoolClient) => {
        return this.getCurrentUserIdFromClient(pgClient);
      },
      { accessToken }
    ) as Promise<string>;
  }

  public async transaction(
    callback: (pgClient: PoolClient) => Promise<unknown>,
    transactionAuth: ITransactionAuth = {},
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<unknown> {
    const pgClient: PoolClient = await this._pgPool.connect();

    const tAuth: ITransactionAuth = {
      accessToken: transactionAuth.accessToken || null,
      rootAccess: transactionAuth.rootAccess === true,
    };

    try {
      await pgClient.query("BEGIN;");

      if (tAuth.accessToken != null) {
        await this.authenticateTransaction(pgClient, tAuth.accessToken);
      }

      if (tAuth.rootAccess === true) {
        await this.setRoot(pgClient);
      }

      const result: unknown = await callback(pgClient);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this._logger.warn("transaction.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async query(transactionAuth: ITransactionAuth = {}, ...queryArguments: [string, ...any[]]): Promise<any> {
    const pgClient: PoolClient = await this._pgPool.connect();

    const tAuth: ITransactionAuth = {
      accessToken: transactionAuth.accessToken || null,
      rootAccess: transactionAuth.rootAccess === true,
    };

    try {
      await pgClient.query("BEGIN;");

      if (tAuth.accessToken != null) {
        await this.authenticateTransaction(pgClient, tAuth.accessToken);
      }

      if (tAuth.rootAccess === true) {
        await this.setRoot(pgClient);
      }

      const result: QueryResult = await pgClient.query(...queryArguments);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this._logger.warn("query.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async adminTransaction(
    callback: (pgClient: PoolClient) => Promise<any>,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<any> {
    const pgClient: PoolClient = await this._pgPool.connect();

    try {
      await this._createPgClientAdminTransaction(pgClient, isolationLevel);

      const result: unknown = await callback(pgClient);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this._logger.warn("adminTransaction.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async adminQuery(...queryArguments: [string, ...any[]]): Promise<QueryResult> {
    const pgClient: PoolClient = await this._pgPool.connect();

    try {
      await pgClient.query("BEGIN;");

      await this.setAdmin(pgClient);

      const result: QueryResult = await pgClient.query(...queryArguments);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this._logger.warn("adminQuery.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async adminQueryWithPgClient(
    pgClient: PoolClient,
    ...queryArguments: [string, ...any[]]
  ): Promise<QueryResult> {
    await this.setAdmin(pgClient);
    const result: QueryResult = await pgClient.query(...queryArguments);
    await this.unsetAdmin(pgClient);

    return result;
  }

  public async authenticateTransaction(pgClient: PoolClient, accessToken: string): Promise<true> {
    try {
      if (accessToken == null || accessToken === "") {
        throw new AuthenticationError("Authentication required. AccessToken missing.");
      }
      const values: unknown[] = [this._cryptoFactory.decrypt(accessToken)];

      await this.setAdmin(pgClient);
      await pgClient.query("SELECT _auth.authenticate_transaction($1);", values);
      await this.unsetAdmin(pgClient);

      return true;
    } catch (err) {
      this._logger.warn("authenticateTransaction.error", err);
      throw err;
    }
  }

  public async unauthenticateTransaction(pgClient: PoolClient): Promise<true> {
    try {
      await this.setAdmin(pgClient);
      await pgClient.query("SELECT _auth.authenticate_transaction($1);");
      await this.unsetAdmin(pgClient);

      return true;
    } catch (err) {
      this._logger.warn("unauthenticateTransaction.error", err);
      throw err;
    }
  }

  public async setAdmin(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query(`SET LOCAL auth.admin_token TO '${this._signHelper.getAdminSignature()}';`);
      return pgClient;
    } catch (err) {
      this._logger.warn("setAdmin.error", err);
      throw err;
    }
  }

  public async unsetAdmin(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query("RESET auth.admin_token;");
      return pgClient;
    } catch (err) {
      this._logger.warn("unsetAdmin.error", err);
      throw err;
    }
  }

  public async setRoot(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query(`SET LOCAL auth.root_token TO '${this._signHelper.getRootSignature()}';`);
      return pgClient;
    } catch (err) {
      this._logger.warn("setRoot.error", err);
      throw err;
    }
  }

  public async unsetRoot(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query("RESET auth.root_token;");
      return pgClient;
    } catch (err) {
      this._logger.warn("unsetRoot.error", err);
      throw err;
    }
  }

  public setPool(pgPool: Pool): void {
    this._pgPool = pgPool;
  }
}
