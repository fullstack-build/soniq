import { Pool as PgPool, PoolConfig as PgPoolConfig, PoolClient as PgPoolClient, types as PgTypes } from "pg";
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str) => str);
PgTypes.setTypeParser(1082, (str) => str);

export { PgPool, PgPoolClient };
import { Service, Inject, Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { IDbConfig, IDbGeneralPoolConfig } from "../IDbConfig";
import { HookManager } from "./HookManager";

@Service()
export class DbGeneralPool {
  private readonly logger: ILogger;
  private readonly config: IDbConfig;
  private applicationName: string;
  private credentials: PgPoolConfig;
  public readonly hookManager: HookManager;
  public pgPool: PgPool;

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => GracefulShutdown) gracefulShutdown: GracefulShutdown,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => HookManager) hookManager: HookManager
  ) {
    this.hookManager = hookManager;
    this.config = config.registerConfig("Db", `${__dirname}/../../config`);
    this.logger = loggerFactory.create(this.constructor.name);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addShutdownFunction(this.constructor.name, this.end.bind(this));
  }

  private async boot(): Promise<void> {
    const env: IEnvironment = Container.get("ENVIRONMENT");
    this.applicationName = `${env.namespace}_pool_${env.nodeId}`;
    await this.gracefullyAdjustPoolSize(1); // assume we are the only connnected node
  }

  private async createInitialConectionToTestThePool(): Promise<PgPool> {
    try {
      this.hookManager.executePoolInitialConnectStartHooks(this.applicationName);

      const poolClient = await this.pgPool.connect();

      this.logger.trace("Postgres pool initial connection created");
      this.hookManager.executePoolInitialConnectSuccessHooks(this.applicationName);

      await poolClient.release();

      this.logger.trace("Postgres pool initial connection released");
      this.hookManager.executePoolInitialConnectReleaseHooks(this.applicationName);
    } catch (err) {
      this.logger.warn("Postgres pool connection creation error", err);
      this.hookManager.executePoolInitialConnectErrorHooks(this.applicationName, err);

      throw err;
    }

    return this.pgPool;
  }

  private async end(): Promise<void> {
    this.logger.trace("Postgres pool ending initiated");
    this.hookManager.executePoolEndStartHooks(this.applicationName);

    try {
      const poolEndResult = await this.pgPool.end();

      this.logger.trace("Postgres pool ended successfully");
      this.hookManager.executePoolEndSuccessHooks(this.applicationName);

      return poolEndResult;
    } catch (err) {
      this.logger.warn("Postgres pool ended with an error", err);
      this.hookManager.executePoolEndErrorHooks(this.applicationName, err);

      throw err;
    }
  }

  public async gracefullyAdjustPoolSize(totalNumberOfConnectedClients: number): Promise<PgPool> {
    const configDbGeneral: IDbGeneralPoolConfig = this.config.general;

    const poolMin: number = configDbGeneral.min;
    const poolTotalMax: number = configDbGeneral.totalMax;
    if (!Number.isInteger(poolMin) || !Number.isInteger(poolTotalMax)) {
      throw Error("DbGeneralPool.gracefullyAdjustPoolSize.poolSize.min.and.totalMax.must.be.numbers");
    }

    // reserve one for DbAppClient connection
    const connectionsPerInstance: number = Math.floor(poolTotalMax / totalNumberOfConnectedClients - 1);

    this.logger.debug(`GracefullyAdjustPoolSize with ${connectionsPerInstance} connections per instance`);
    if (this.credentials == null || this.credentials.max !== connectionsPerInstance) {
      if (this.pgPool != null) {
        // don't wait for promise, we just immediately create a new pool
        // this one will end as soon as the last connection is released
        this.end();
      }

      this.credentials = {
        ...configDbGeneral,
        application_name: this.applicationName,
        min: poolMin,
        max: connectionsPerInstance
      };
      this.pgPool = new PgPool(this.credentials);

      this.logger.debug(`Postgres pool created (min: ${this.credentials.min} / max: ${this.credentials.max})`);
      this.hookManager.executePoolCreatedHooks(this.applicationName);

      return this.createInitialConectionToTestThePool();
    }
  }
}
