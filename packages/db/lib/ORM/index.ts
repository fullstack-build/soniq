import { types as PgTypes } from "pg";
import { createConnection, Connection as TypeOrmConnection, ConnectionOptions } from "typeorm";
export { BaseEntity, Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
// migrations
export { MigrationInterface, QueryRunner } from "typeorm";

// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str) => str);
PgTypes.setTypeParser(1082, (str) => str);

import { Service, Inject, Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { EventEmitter } from "@fullstack-one/events";
import { DbAppClient } from "../DbAppClient";

export interface IOrmConfig {
  connection: ConnectionOptions;
  pool: {
    min: number;
    max: number;
    globalMax: number;
    updateClientListInterval: number;
  };
}

@Service()
export class ORM {
  private readonly logger: ILogger;
  private readonly config: IOrmConfig;
  private readonly environment: IEnvironment;
  private readonly eventEmitter: EventEmitter;
  private readonly applicationNamePrefix: string;
  private readonly applicationName: string;
  private knownNodeIds: string[] = [];
  private connectedNodesTimer: NodeJS.Timer;
  private readonly dbAppClient: DbAppClient;
  public typeOrmConnection: TypeOrmConnection;

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => GracefulShutdown) gracefulShutdown: GracefulShutdown,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => EventEmitter) eventEmitter: EventEmitter,
    @Inject((type) => DbAppClient) dbAppClient: DbAppClient
  ) {
    this.logger = loggerFactory.create(this.constructor.name);
    this.eventEmitter = eventEmitter;
    this.dbAppClient = dbAppClient;

    this.config = config.registerConfig("Db", `${__dirname}/../../config`).orm;
    const env = (this.environment = Container.get("ENVIRONMENT"));
    this.applicationNamePrefix = `${env.namespace}_orm_`;
    this.applicationName = `${this.applicationNamePrefix}${env.nodeId}`;
    this.knownNodeIds = [env.nodeId];

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addShutdownFunction(this.constructor.name, this.end.bind(this));
  }

  private async boot(): Promise<void> {
    this.addEventListeners();
    // Assume that I am the first connected node, try to allocate all available connections.
    await this.createPool(this.config.pool.globalMax);
    await this.setIntervalToCheckConnectedNodes();
  }

  private async createPool(max: number = 2): Promise<void> {
    const path: string = this.environment.path;

    const connectionOptions: ConnectionOptions = {
      ...this.config.connection,
      extra: { ...this.config.connection.extra, application_name: this.applicationName, min: this.config.pool.min || 1, max },
      entities: (this.config.connection.entities || []).map((entity: string) => (typeof entity === "string" ? `${path}${entity}` : entity)),
      migrations: (this.config.connection.migrations || []).map((migration: string) =>
        typeof migration === "string" ? `${path}${migration}` : migration
      ),
      subscribers: (this.config.connection.subscribers || []).map((subscriber: string) =>
        typeof subscriber === "string" ? `${path}${subscriber}` : subscriber
      )
    };
    // add package migrations
    connectionOptions.migrations.push(`${__dirname}../migrations`);
    this.typeOrmConnection = await createConnection(connectionOptions);

    this.typeOrmConnection.driver.afterConnect().then(() => {
      this.eventEmitter.emit("db.orm.pool.connect.success", this.applicationName);
      this.logger.debug(`TypeORM pool created (min: ${connectionOptions.extra.min} / max: ${max})`);
    });
  }

  private addEventListeners(): void {
    this.eventEmitter.onAnyInstance("db.orm.pool.connect.success", this.checkConnectedNodes.bind(this));
    this.eventEmitter.onAnyInstance("db.orm.pool.end.success", this.checkConnectedNodes.bind(this));
  }

  private removeEventListeners(): void {
    this.eventEmitter.removeListenerAnyInstance("db.orm.pool.connect.success", this.checkConnectedNodes.bind(this));
    this.eventEmitter.removeListenerAnyInstance("db.orm.pool.end.success", this.checkConnectedNodes.bind(this));
  }

  private async setIntervalToCheckConnectedNodes(): Promise<void> {
    await this.checkConnectedNodes();
    this.connectedNodesTimer = setInterval(this.checkConnectedNodes.bind(this), this.config.pool.updateClientListInterval);
  }

  private removeIntervalToCheckConnectedNodes(): void {
    clearInterval(this.connectedNodesTimer);
  }

  private async checkConnectedNodes(): Promise<void> {
    const connectedNodeIds = await this.fetchConnectedNodes();
    if (this.knownNodeIds.length !== connectedNodeIds.length) {
      this.adjustORMPoolSize(connectedNodeIds.length);

      this.logger.debug("Postgres number of connected ONE clients changed", connectedNodeIds);
      this.eventEmitter.emit("db.number.of.connected.clients.changed");
    }
    this.knownNodeIds = connectedNodeIds;
  }

  private async fetchConnectedNodes(): Promise<string[]> {
    try {
      const prefix = this.dbAppClient.getApplicationNamePrefix();
      const dbNodes = await this.dbAppClient.pgClient.query(
        `SELECT application_name FROM pg_stat_activity WHERE datname = '${this.config.connection.database}' AND application_name LIKE '${prefix}%';`
      );

      return dbNodes.rows.map(({ application_name: name }) => name.replace(prefix, ""));
    } catch (err) {
      this.logger.warn("Error when fetching connected nodes", err);
      return this.knownNodeIds;
    }
  }

  private async adjustORMPoolSize(numberOfConnectedNodes: number): Promise<void> {
    const connectionsPerInstance: number = Math.floor(this.config.pool.globalMax / numberOfConnectedNodes);
    this.logger.debug(
      `adjustORMPoolSize with ${connectionsPerInstance} connections per instance for ${numberOfConnectedNodes} connected nodes` +
        `and a global maximum of ${this.config.pool.globalMax}.`
    );

    // don't wait for promise, we just immediately create a new pool
    // this one will end as soon as the last connection is released
    if (this.typeOrmConnection != null) await this.typeOrmConnection.close();
    this.logger.debug("Old postgres ORM pool ended");
    // start new pool
    await this.createPool(connectionsPerInstance);
  }

  private async end(): Promise<void> {
    this.logger.trace("Postgres ORM pool ending initiated");

    this.removeEventListeners();
    this.removeIntervalToCheckConnectedNodes();

    this.eventEmitter.emit("db.orm.pool.end.start", this.applicationName);

    try {
      await this.typeOrmConnection.close();

      this.logger.trace("Postgres ORM pool ended successfully");
      this.eventEmitter.emit("db.orm.pool.end.success", this.applicationName);
    } catch (err) {
      this.logger.warn("Postgres ORM pool ended with an error", err);
      this.eventEmitter.emit("db.orm.pool.end.error", { applicationName: this.applicationName, err });

      throw err;
    }
  }
}
