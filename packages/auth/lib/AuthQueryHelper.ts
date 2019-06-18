import { IsolationLevel, ORM, PostgresQueryRunner } from "@fullstack-one/db";
import { ILogger } from "@fullstack-one/logger";
import { CryptoFactory } from "./CryptoFactory";
import { SignHelper } from "./SignHelper";

export class AuthQueryHelper {
  private possibleTransactionIsolationLevels: IsolationLevel[] = ["SERIALIZABLE", "REPEATABLE READ", "READ COMMITTED", "READ UNCOMMITTED"];

  constructor(
    private readonly orm: ORM,
    private readonly logger: ILogger,
    private readonly cryptoFactory: CryptoFactory,
    private readonly signHelper: SignHelper
  ) {}

  private async createQueryRunnerAdminTransaction(
    queryRunner: PostgresQueryRunner,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<PostgresQueryRunner> {
    const isolationLevelIndex = this.possibleTransactionIsolationLevels.findIndex((item) => isolationLevel.toLowerCase() === item.toLowerCase());
    const isolationLevelToUse = this.possibleTransactionIsolationLevels[isolationLevelIndex];

    await queryRunner.startTransaction(isolationLevelToUse);
    await this.setAdmin(queryRunner);
    return queryRunner;
  }

  private async createQueryRunnerUserTransaction(
    queryRunner: PostgresQueryRunner,
    accessToken: string,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<PostgresQueryRunner> {
    const isolationLevelIndex = this.possibleTransactionIsolationLevels.findIndex((item) => isolationLevel.toLowerCase() === item.toLowerCase());
    const isolationLevelToUse = this.possibleTransactionIsolationLevels[isolationLevelIndex];

    await queryRunner.startTransaction(isolationLevelToUse);
    await this.authenticateTransaction(queryRunner, accessToken);
    return queryRunner;
  }

  public async getCurrentUserIdFromClient(queryRunner: PostgresQueryRunner) {
    return (await queryRunner.query("SELECT _auth.current_user_id();"))[0].current_user_id;
  }

  public async getCurrentUserIdFromAccessToken(accessToken: string) {
    return this.userTransaction(accessToken, async (queryRunner) => {
      return this.getCurrentUserIdFromClient(queryRunner);
    });
  }

  public async adminTransaction<TResult = any>(
    callback: (queryRunner: PostgresQueryRunner) => Promise<TResult>,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<any> {
    const queryRunner = this.orm.createQueryRunner();

    try {
      await queryRunner.connect();
      await this.createQueryRunnerAdminTransaction(queryRunner, isolationLevel);

      const result = await callback(queryRunner);

      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.warn("adminTransaction.error", err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  public async adminQuery<TResult = any>(...queryArguments: [string, ...any[]]): Promise<TResult> {
    const queryRunner = this.orm.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await this.setAdmin(queryRunner);

      const result: TResult = await queryRunner.query(...queryArguments);

      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.warn("adminQuery.error", err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  public async userTransaction<TResult = any>(
    accessToken: string,
    callback: (queryRunner: PostgresQueryRunner) => Promise<TResult>,
    isolationLevel: IsolationLevel = "READ COMMITTED"
  ): Promise<TResult> {
    const queryRunner = this.orm.createQueryRunner();

    try {
      await queryRunner.connect();
      await this.createQueryRunnerUserTransaction(queryRunner, accessToken, isolationLevel);

      const result = await callback(queryRunner);

      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.warn("userTransaction.error", err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  public async userQuery<TResult = any>(accessToken: string, ...queryArguments: [string, ...any[]]): Promise<TResult> {
    const queryRunner = await this.orm.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await this.authenticateTransaction(queryRunner, accessToken);

      const result = await queryRunner.query(...queryArguments);

      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.warn("userQuery.error", err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  public async authenticateTransaction(queryRunner: PostgresQueryRunner, accessToken: string) {
    try {
      const values = [this.cryptoFactory.decrypt(accessToken)];

      await this.setAdmin(queryRunner);
      await queryRunner.query("SELECT _auth.authenticate_transaction($1);", values);
      await this.unsetAdmin(queryRunner);

      return true;
    } catch (err) {
      this.logger.warn("authenticateTransaction.error", err);
      throw err;
    }
  }

  public async setAdmin(queryRunner: PostgresQueryRunner) {
    try {
      await queryRunner.query(`SET LOCAL auth.admin_token TO '${this.signHelper.getAdminSignature()}';`);
      return queryRunner;
    } catch (err) {
      this.logger.warn("setAdmin.error", err);
      throw err;
    }
  }

  public async unsetAdmin(queryRunner: PostgresQueryRunner) {
    try {
      await queryRunner.query("RESET auth.admin_token;");
      return queryRunner;
    } catch (err) {
      this.logger.warn("unsetAdmin.error", err);
      throw err;
    }
  }
}
