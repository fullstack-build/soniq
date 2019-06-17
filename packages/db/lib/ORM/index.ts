import { types as PgTypes } from "pg";
import * as typeorm from "typeorm";
import { PostgresQueryRunner } from "typeorm/driver/postgres/PostgresQueryRunner";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { Service, Inject } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { EventEmitter } from "@fullstack-one/events";
import * as dbMigrationsObject from "../migrations";
import getClientManager, { IClientManager } from "./getClientManager";
import gracefullyRemoveConnection from "./gracefullyRemoveConnection";
import * as modelMeta from "./model-meta";
import { IOrmConfig } from "./types";

export { Connection, ConnectionManager, MigrationInterface, QueryBuilder } from "typeorm";
export { PostgresQueryRunner } from "typeorm/driver/postgres/PostgresQueryRunner";
export { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
export * from "./decorator";

// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str) => str);
PgTypes.setTypeParser(1082, (str) => str);

@Service()
export class ORM {
  private readonly logger: ILogger;
  private readonly config: IOrmConfig;
  private readonly environment: IEnvironment;
  private readonly applicationNamePrefix: string;
  private readonly applicationName: string;
  private readonly clientManager: IClientManager;
  private readonly migrations: Array<new () => typeorm.MigrationInterface> = [];
  private readonly entities: Array<new () => any> = [];

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => GracefulShutdown) gracefulShutdown: GracefulShutdown,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => EventEmitter) private readonly eventEmitter: EventEmitter,
    @Inject("ENVIRONMENT") environment: IEnvironment
  ) {
    this.logger = loggerFactory.create(this.constructor.name);

    this.config = config.registerConfig("Db", `${__dirname}/../../config`).orm;
    this.environment = environment;
    this.applicationNamePrefix = `${environment.namespace}_orm_`;
    this.applicationName = `${this.applicationNamePrefix}${environment.nodeId}`;

    this.clientManager = getClientManager(environment.nodeId, this.adjustORMPoolSize.bind(this));

    this.addMigrations(Object.values(dbMigrationsObject));

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addShutdownFunction(this.constructor.name, this.end.bind(this));
  }

  private async boot(): Promise<void> {
    await this.runMigrations();
    await this.createConnection(this.config.pool.globalMax);
    await this.clientManager.start();
    await this.eventEmitter.emit("db.orm.pool.connect.success", this.applicationName);
  }

  private async runMigrations(): Promise<void> {
    try {
      this.logger.debug("db.orm.migrations.start");
      const connection = await typeorm.createConnection({
        ...this.config.connection,
        synchronize: false,
        name: "migration",
        migrations: this.migrations
      });
      await connection.runMigrations();
      await connection.close();
      this.logger.debug("db.orm.migrations.end");
    } catch (err) {
      this.logger.error("db.orm.migrations.error", err);
    }
  }

  private async createConnection(max: number = 2): Promise<void> {
    const path: string = this.environment.path;
    const connectionOptions: PostgresConnectionOptions = {
      ...this.config.connection,
      extra: { ...this.config.connection.extra, application_name: this.applicationName, min: this.config.pool.min || 1, max },
      entities: [
        ...(this.config.connection.entities || []).map((entity: string) => (typeof entity === "string" ? `${path}${entity}` : entity)),
        ...this.entities
      ],
      migrations: this.migrations
    };
    await typeorm.createConnection(connectionOptions);

    await typeorm.getConnection().driver.afterConnect();
    this.logger.debug("db.orm.pool.connect.success", `TypeORM pool created (min: ${connectionOptions.extra.min} / max: ${max})`);
  }

  private async adjustORMPoolSize(numberOfConnectedNodes: number): Promise<void> {
    const connectionsPerInstance: number = Math.floor(this.config.pool.globalMax / numberOfConnectedNodes);
    this.logger.debug(
      `adjustORMPoolSize with ${connectionsPerInstance} connections per instance for ${numberOfConnectedNodes} connected nodes` +
        `and a global maximum of ${this.config.pool.globalMax}.`
    );

    if (typeorm.getConnection() != null) {
      gracefullyRemoveConnection(typeorm.getConnection()).then(() => {
        this.logger.debug("db.orm.old.connection.removed");
      });
    }

    await this.createConnection(connectionsPerInstance);
  }

  private async end(): Promise<void> {
    this.logger.trace("Postgres ORM pool ending initiated");

    this.eventEmitter.emit("db.orm.pool.end.start", this.applicationName);
    await this.clientManager.stop();

    try {
      await typeorm.getConnection().close();

      this.logger.trace("Postgres ORM pool ended successfully");
      this.eventEmitter.emit("db.orm.pool.end.success", this.applicationName);
    } catch (err) {
      this.logger.warn("Postgres ORM pool ended with an error", err);

      throw err;
    }
  }

  public addEntity(entity: new () => void): void {
    this.entities.push(entity);
  }

  public addMigration(migration: new () => typeorm.MigrationInterface): void {
    this.migrations.push(migration);
  }

  public addMigrations(migrations: Array<new () => typeorm.MigrationInterface>): void {
    migrations.forEach((migration) => this.migrations.push(migration));
  }

  public get graphQlSDL(): string {
    return modelMeta.toSdl();
  }

  public getConnection(): typeorm.Connection {
    return typeorm.getConnection();
  }

  public createQueryRunner(): PostgresQueryRunner {
    return typeorm.getConnection().createQueryRunner() as PostgresQueryRunner;
  }
}
