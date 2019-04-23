import { Service, Inject, Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { EventEmitter } from "@fullstack-one/events";
import { Client as PgClient, types as PgTypes } from "pg";
import { IDbConfig, IDbAppClientConfig } from "../IDbConfig";
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str: any) => str);
PgTypes.setTypeParser(1082, (str: any) => str);

export { PgClient };

@Service()
export class DbAppClient {
  private applicationNamePrefix: string;
  private applicationName: string;
  private readonly credentials: IDbAppClientConfig;

  private readonly ENVIRONMENT: IEnvironment;
  private readonly logger: ILogger;
  private readonly config: IDbConfig;
  private readonly eventEmitter: EventEmitter;
  public readonly databaseName: string;
  public pgClient: PgClient;

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => GracefulShutdown) gracefulShutdown: GracefulShutdown,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => EventEmitter) eventEmitter: EventEmitter
  ) {
    this.config = config.registerConfig("Db", `${__dirname}/../../config`);
    this.eventEmitter = eventEmitter;
    this.credentials = this.config.appClient;
    this.databaseName = this.config.appClient.database;

    this.ENVIRONMENT = Container.get("ENVIRONMENT");
    this.logger = loggerFactory.create(this.constructor.name);

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addShutdownFunction(this.constructor.name, this.end.bind(this));
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
    this.eventEmitter.emit("db.application.client.created", this.applicationName);

    try {
      this.eventEmitter.emit("db.application.client.connect.start", this.applicationName);

      await this.pgClient.connect();

      this.logger.trace("Postgres setup connection created");
      this.eventEmitter.emit("db.application.client.connect.success", this.applicationName);
    } catch (err) {
      this.logger.warn("Postgres setup connection creation error", err);
      this.eventEmitter.emit("db.application.client.connect.error", { applicationName: this.applicationName, err });

      throw err;
    }
  }

  private async end(): Promise<void> {
    this.logger.trace("Postgres connection ending initiated");
    this.eventEmitter.emit("db.application.client.end.start", this.applicationName);

    try {
      const clientEndResult = await this.pgClient.end();

      this.logger.trace("Postgres connection ended successfully");
      this.eventEmitter.emit("db.application.client.end.success", this.applicationName);

      return clientEndResult;
    } catch (err) {
      this.logger.warn("Postgres connection ended with an error", err);
      this.eventEmitter.emit("db.application.client.end.error", { applicationName: this.applicationName, err });

      throw err;
    }
  }

  public getApplicationNamePrefix(): string {
    return this.applicationNamePrefix;
  }
}
