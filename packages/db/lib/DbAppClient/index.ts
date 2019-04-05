import { Service, Inject, Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { IDb } from "../types";
import { Client as PgClient, ClientConfig as PgClientConfig, types as PgTypes } from "pg";
import { IDbConfig, IDbAppClientConfig } from "../IDbConfig";
import { HookManager } from "./HookManager";
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str: any) => str);
PgTypes.setTypeParser(1082, (str: any) => str);

export { PgClient };

@Service()
export class DbAppClient implements IDb {
  private applicationNamePrefix: string;
  private applicationName: string;
  private readonly credentials: IDbAppClientConfig;

  private readonly ENVIRONMENT: IEnvironment;
  private readonly logger: ILogger;
  private readonly config: IDbConfig;
  public readonly hookManager: HookManager;
  public readonly databaseName: string;
  public pgClient: PgClient;

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => HookManager) hookManager: HookManager
  ) {
    this.hookManager = hookManager;

    this.config = config.registerConfig("Db", `${__dirname}/../../config`);
    this.credentials = this.config.appClient;
    this.databaseName = this.config.appClient.database;

    this.ENVIRONMENT = Container.get("ENVIRONMENT");
    this.logger = loggerFactory.create(this.constructor.name);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot(): Promise<void> {
    this.applicationNamePrefix = `${this.ENVIRONMENT.namespace}_client_`;
    this.applicationName = `${this.applicationNamePrefix}${this.ENVIRONMENT.nodeId}`;

    // Config is 'any' because @types/pg@7.4.* does not support application_name property
    const pgClientConfig: any = {
      ...this.credentials,
      application_name: this.applicationName
    };
    this.pgClient = new PgClient(pgClientConfig);

    this.logger.debug("Postgres setup pgClient created");
    this.hookManager.executeClientCreatedHooks(this.applicationName);

    try {
      this.hookManager.executeClientConnectStartHooks(this.applicationName);

      await this.pgClient.connect();

      this.logger.trace("Postgres setup connection created");
      this.hookManager.executeClientConnectSuccessHooks(this.applicationName);
    } catch (err) {
      this.logger.warn("Postgres setup connection creation error", err);
      this.hookManager.executeClientConnectErrorHooks(this.applicationName, err);

      throw err;
    }
  }

  public async end(): Promise<void> {
    this.logger.trace("Postgres connection ending initiated");
    this.hookManager.executeClientConnectStartHooks(this.applicationName);

    try {
      const clientEndResult = await this.pgClient.end();

      this.logger.trace("Postgres connection ended successfully");
      // can only be caught locally (=> db connection ended)
      this.hookManager.executeClientEndSuccessHooks(this.applicationName);

      return clientEndResult;
    } catch (err) {
      this.logger.warn("Postgres connection ended with an error", err);
      this.hookManager.executeClientEndErrorHooks(this.applicationName, err);

      throw err;
    }
  }

  public getApplicationNamePrefix(): string {
    return this.applicationNamePrefix;
  }
}
