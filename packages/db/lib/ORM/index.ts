import { types as PgTypes } from "pg";
import { createConnection, Connection as TypeOrmConnection, MigrationInterface, getConnection } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

import * as dbMigrationsObject from "../migrations";
import NodeJsClient from "../model/NodeJsClient";

export { MigrationInterface, QueryRunner } from "typeorm";

export { BaseEntity } from "./BaseEntity";
export * from "./decorator";

// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str) => str);
PgTypes.setTypeParser(1082, (str) => str);

import { Service, Inject, Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { EventEmitter } from "@fullstack-one/events";
import getClientManager, { IClientManager } from "./getClientManager";
import { IOrmConfig } from "./types";
import * as modelMeta from "./model-meta";
import { PostgresQueryRunner } from "typeorm/driver/postgres/PostgresQueryRunner";
import gracefullyRemoveConnection from "./gracefullyRemoveConnection";

@Service()
export class ORM {
  private readonly logger: ILogger;
  private readonly config: IOrmConfig;
  private readonly applicationNamePrefix: string;
  private readonly applicationName: string;
  private readonly clientManager: IClientManager;
  private readonly migrations: Array<new () => MigrationInterface> = [];
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
    this.applicationNamePrefix = `${environment.namespace}_orm_`;
    this.applicationName = `${this.applicationNamePrefix}${environment.nodeId}`;

    this.clientManager = getClientManager(environment.nodeId, this.adjustORMPoolSize.bind(this));

    this.addMigrations(Object.values(dbMigrationsObject));
    this.addEntity(NodeJsClient);

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
      const connection = await createConnection({
        ...this.config.connection,
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
    const connectionOptions: PostgresConnectionOptions = {
      ...this.config.connection,
      extra: { ...this.config.connection.extra, application_name: this.applicationName, min: this.config.pool.min || 1, max },
      entities: this.entities // (this.config.connection.entities || []).map((entity: string) => (typeof entity === "string" ? `${path}${entity}` : entity)),
    };
    await createConnection(connectionOptions);

    await getConnection().driver.afterConnect();
    this.logger.debug("db.orm.pool.connect.success", `TypeORM pool created (min: ${connectionOptions.extra.min} / max: ${max})`);
  }

  private async adjustORMPoolSize(numberOfConnectedNodes: number): Promise<void> {
    const connectionsPerInstance: number = Math.floor(this.config.pool.globalMax / numberOfConnectedNodes);
    this.logger.debug(
      `adjustORMPoolSize with ${connectionsPerInstance} connections per instance for ${numberOfConnectedNodes} connected nodes` +
        `and a global maximum of ${this.config.pool.globalMax}.`
    );

    if (getConnection() != null) {
      gracefullyRemoveConnection(getConnection()).then(() => {
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
      await getConnection().close();

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

  public addMigration(migration: new () => MigrationInterface): void {
    this.migrations.push(migration);
  }

  public addMigrations(migrations: Array<new () => MigrationInterface>): void {
    migrations.forEach((migration) => this.migrations.push(migration));
  }

  public get graphQlSDL(): string {
    return modelMeta.toSdl();
  }

  public getConnection(): TypeOrmConnection {
    return getConnection();
  }

  public createQueryRunner(): PostgresQueryRunner {
    return getConnection().createQueryRunner() as PostgresQueryRunner;
  }
}
