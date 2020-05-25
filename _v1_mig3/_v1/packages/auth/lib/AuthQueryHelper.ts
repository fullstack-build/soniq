import { PoolClient, Pool, QueryResult } from "@fullstack-one/core";
type IsolationLevel = any;
import { ILogger } from "@fullstack-one/logger";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";
import { AuthenticationError } from "@fullstack-one/graphql";
import { ITransactionAuth } from "./interfaces";

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

  public async getCurrentUserIdFromClient(pgClient: PoolClient) {
    return (await pgClient.query("SELECT _auth.current_user_id();"))[0].current_user_id;
  }

  public async getCurrentUserIdFromAccessToken(accessToken: string) {
    return this.transaction(async (pgClient) => {
      return this.getCurrentUserIdFromClient(pgClient);
    }, { accessToken });
  }

  public async transaction(callback: (pgClient: PoolClient) => Promise<any>, transactionAuth: ITransactionAuth = {}, isolationLevel: IsolationLevel = "READ COMMITTED"): Promise<any> {
    const pgClient = await this.pgPool.connect();

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

  public async query(transactionAuth: ITransactionAuth = {}, ...queryArguments: [string, ...any[]]): Promise<any> {
    const pgClient = await this.pgPool.connect();

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

  public async setRoot(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query(`SET LOCAL auth.root_token TO '${this.signHelper.getRootSignature()}';`);
      return pgClient;
    } catch (err) {
      this.logger.warn("setRoot.error", err);
      throw err;
    }
  }

  public async unsetRoot(pgClient: PoolClient): Promise<PoolClient> {
    try {
      await pgClient.query("RESET auth.root_token;");
      return pgClient;
    } catch (err) {
      this.logger.warn("unsetRoot.error", err);
      throw err;
    }
  }

  public setPool(pgPool: Pool) {
    this.pgPool = pgPool;
  }
}
