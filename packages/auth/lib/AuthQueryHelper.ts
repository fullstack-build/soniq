import { PoolClient, Pool, QueryResult } from "@fullstack-one/core";
type IsolationLevel = any;
import { ILogger } from "@fullstack-one/logger";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";
import { AuthenticationError } from "@fullstack-one/graphql";

export class AuthQueryHelper {
  private possibleTransactionIsolationLevels: IsolationLevel[] = ["SERIALIZABLE", "REPEATABLE READ", "READ COMMITTED", "READ UNCOMMITTED"];

  constructor(
    private pgPool: Pool,
    private readonly logger: ILogger,
    private readonly cryptoFactory: CryptoFactory,
    private readonly signHelper: SignHelper
  ) {}

  private async createPgClientAdminTransaction(pgClient: PoolClient, isolationLevel: IsolationLevel = "READ COMMITTED"): Promise<PoolClient> {
    const isolationLevelIndex = this.possibleTransactionIsolationLevels.findIndex((item) => isolationLevel.toLowerCase() === item.toLowerCase());
    const isolationLevelToUse = this.possibleTransactionIsolationLevels[isolationLevelIndex];

    await pgClient.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevelToUse};`);
    await this.setAdmin(pgClient);
    return pgClient;
  }

  private async createPgClientUserTransaction(
    pgClient: PoolClient,
    accessToken: string,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<PoolClient> {
    const isolationLevelIndex = this.possibleTransactionIsolationLevels.findIndex((item) => isolationLevel.toLowerCase() === item.toLowerCase());
    const isolationLevelToUse = this.possibleTransactionIsolationLevels[isolationLevelIndex];

    await pgClient.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevelToUse};`);
    await this.authenticateTransaction(pgClient, accessToken);
    return pgClient;
  }

  public async getCurrentUserIdFromClient(pgClient: PoolClient) {
    return (await pgClient.query("SELECT _auth.current_user_id();"))[0].current_user_id;
  }

  public async getCurrentUserIdFromAccessToken(accessToken: string) {
    return this.userTransaction(accessToken, async (pgClient) => {
      return this.getCurrentUserIdFromClient(pgClient);
    });
  }

  public async transaction(callback: (pgClient: PoolClient) => Promise<any>, isolationLevel: IsolationLevel = "READ COMMITTED"): Promise<any> {
    const pgClient = await this.pgPool.connect();

    try {
      await pgClient.query("BEGIN;");

      const result = await callback(pgClient);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this.logger.warn("transaction.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async query(...queryArguments: [string, ...any[]]): Promise<any> {
    const pgClient = await this.pgPool.connect();

    try {
      await pgClient.query("BEGIN;");

      const result: QueryResult = await pgClient.query(...queryArguments);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this.logger.warn("query.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async adminTransaction(callback: (pgClient: PoolClient) => Promise<any>, isolationLevel: IsolationLevel = "READ COMMITTED"): Promise<any> {
    const pgClient = await this.pgPool.connect();

    try {
      await this.createPgClientAdminTransaction(pgClient, isolationLevel);

      const result = await callback(pgClient);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this.logger.warn("adminTransaction.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async adminQuery(...queryArguments: [string, ...any[]]): Promise<QueryResult> {
    const pgClient = await this.pgPool.connect();

    try {
      await pgClient.query("BEGIN;");

      await this.setAdmin(pgClient);

      const result: QueryResult = await pgClient.query(...queryArguments);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this.logger.warn("adminQuery.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async adminQueryWithPgClient(pgClient: PoolClient, ...queryArguments: [string, ...any[]]): Promise<QueryResult> {
    await this.setAdmin(pgClient);
    const result: QueryResult = await pgClient.query(...queryArguments);
    await this.unsetAdmin(pgClient);

    return result;
  }

  public async userTransaction(
    accessToken: string,
    callback: (pgClient: PoolClient) => Promise<any>,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<any> {
    const pgClient = await this.pgPool.connect();

    try {
      await this.createPgClientUserTransaction(pgClient, accessToken, isolationLevel);

      const result = await callback(pgClient);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this.logger.warn("userTransaction.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async userQuery(accessToken: string, ...queryArguments: [string, ...any[]]): Promise<QueryResult> {
    if (accessToken == null || accessToken === "") {
      throw new AuthenticationError("Authentication required. AccessToken missing.");
    }

    const pgClient = await await this.pgPool.connect();

    try {
      await pgClient.query("BEGIN;");

      await this.authenticateTransaction(pgClient, accessToken);

      const result = await pgClient.query(...queryArguments);

      await pgClient.query("COMMIT;");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK;");
      this.logger.warn("userQuery.error", err);
      throw err;
    } finally {
      await pgClient.release();
    }
  }

  public async authenticateTransaction(pgClient: PoolClient, accessToken: string) {
    try {
      if (accessToken == null || accessToken === "") {
        throw new AuthenticationError("Authentication required. AccessToken missing.");
      }
      const values = [this.cryptoFactory.decrypt(accessToken)];

      await this.setAdmin(pgClient);
      await pgClient.query("SELECT _auth.authenticate_transaction($1);", values);
      await this.unsetAdmin(pgClient);

      return true;
    } catch (err) {
      this.logger.warn("authenticateTransaction.error", err);
      throw err;
    }
  }

  public async unauthenticateTransaction(pgClient: PoolClient) {
    try {
      await this.setAdmin(pgClient);
      await pgClient.query("SELECT _auth.authenticate_transaction($1);");
      await this.unsetAdmin(pgClient);

      return true;
    } catch (err) {
      this.logger.warn("unauthenticateTransaction.error", err);
      throw err;
    }
  }

  public async setAdmin(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query(`SET LOCAL auth.admin_token TO '${this.signHelper.getAdminSignature()}';`);
      return pgClient;
    } catch (err) {
      this.logger.warn("setAdmin.error", err);
      throw err;
    }
  }

  public async unsetAdmin(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query("RESET auth.admin_token;");
      return pgClient;
    } catch (err) {
      this.logger.warn("unsetAdmin.error", err);
      throw err;
    }
  }

  public setPool(pgPool: Pool) {
    this.pgPool = pgPool;
  }
}
