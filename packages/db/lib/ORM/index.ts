import { types as PgTypes } from "pg";
import { createConnection, Connection as TypeOrmConnection } from "typeorm";
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str) => str);
PgTypes.setTypeParser(1082, (str) => str);

import { Service, Inject, Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { EventEmitter } from "@fullstack-one/events";
import { IDbConfig } from "../IDbConfig";
import { DbAppClient } from "../DbAppClient";

@Service()
export class DbGeneralPool {
  private readonly logger: ILogger;
  private readonly config: IDbConfig;
  private readonly dbCredentials: any;
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

    this.config = config.registerConfig("Db", `${__dirname}/../../config`);
    this.dbCredentials = this.config.typeorm;
    const env: IEnvironment = Container.get("ENVIRONMENT");
    this.applicationNamePrefix = `${env.namespace}_pool_`;
    this.applicationName = `${this.applicationNamePrefix}${env.nodeId}`;
    this.knownNodeIds = [env.nodeId];

    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addShutdownFunction(this.constructor.name, this.end.bind(this));
  }

  private async boot(): Promise<void> {
    this.addEventListeners();
    // Assume that I am the only connected node.
    await this.createPool(this.dbCredentials.globalMax);

    await this.setIntervalToCheckConnectedNodes();
  }

  private async createPool(max: number = 2): Promise<void> {
    const dbCredentials = {
      ...this.dbCredentials,
      extra: { ...this.dbCredentials.extra, application_name: this.applicationName, max }
    };
    this.typeOrmConnection = await createConnection(dbCredentials);
    this.logger.debug(`TypeORM pool created (min: ${dbCredentials.min} / max: ${max})`);
  }

  private addEventListeners(): void {
    this.eventEmitter.onAnyInstance("db.general.pool.connect.success", this.checkConnectedNodes);
    this.eventEmitter.onAnyInstance("db.general.pool.end.success", this.checkConnectedNodes);
  }

  private removeEventListeners(): void {
    this.eventEmitter.removeListenerAnyInstance("db.general.pool.connect.success", this.checkConnectedNodes);
    this.eventEmitter.removeListenerAnyInstance("db.general.pool.end.success", this.checkConnectedNodes);
  }

  private async setIntervalToCheckConnectedNodes(): Promise<void> {
    await this.checkConnectedNodes();
    this.connectedNodesTimer = setInterval(this.checkConnectedNodes.bind(this), 1000 /*this.config.updateClientListInterval*/);
  }

  private removeIntervalToCheckConnectedNodes(): void {
    clearInterval(this.connectedNodesTimer);
  }

  private async checkConnectedNodes(): Promise<void> {
    const connectedNodeIds = await this.fetchConnectedNodes();
    if (this.knownNodeIds.length !== connectedNodeIds.length) {
      this.gracefullyAdjustPoolSize(connectedNodeIds.length);

      this.logger.debug("Postgres number of connected ONE clients changed", connectedNodeIds);
      this.eventEmitter.emit("db.number.of.connected.clients.changed");
    }
    this.knownNodeIds = connectedNodeIds;
  }

  private async fetchConnectedNodes(): Promise<string[]> {
    try {
      const prefix = this.dbAppClient.getApplicationNamePrefix();
      const dbNodes = await this.dbAppClient.pgClient.query(
        `SELECT application_name FROM pg_stat_activity WHERE datname = '${this.dbCredentials.database}' AND application_name LIKE '${prefix}%';`
      );

      return dbNodes.rows.map(({ application_name: name }) => name.replace(prefix, ""));
    } catch (err) {
      this.logger.warn("Error when fetching connected nodes", err);
      return this.knownNodeIds;
    }
  }

  private async gracefullyAdjustPoolSize(numberOfConnectedNodes: number): Promise<void> {
    // reserve one connection for this.dbAppClient and one for this.eventEmitter
    const connectionsPerInstance: number = Math.floor((this.dbCredentials.globalMax - 2 * numberOfConnectedNodes) / numberOfConnectedNodes);
    this.logger.debug(
      `GracefullyAdjustPoolSize with ${connectionsPerInstance} connections per instance for ${numberOfConnectedNodes} connected nodes` +
        `and a global maximum of ${this.dbCredentials.globalMax}.`
    );

    // don't wait for promise, we just immediately create a new pool
    // this one will end as soon as the last connection is released
    (async () => {
      if (this.typeOrmConnection != null) await this.typeOrmConnection.end();
      this.logger.debug("Old postgres pool ended");
    })();

    await this.createPool(connectionsPerInstance);
  }

  private async end(): Promise<void> {
    this.logger.trace("Postgres pool ending initiated");

    this.removeEventListeners();
    this.removeIntervalToCheckConnectedNodes();

    this.eventEmitter.emit("db.general.pool.end.start", this.applicationName);

    try {
      await this.typeOrmConnection.close();

      this.logger.trace("Postgres pool ended successfully");
      this.eventEmitter.emit("db.general.pool.end.success", this.applicationName);
    } catch (err) {
      this.logger.warn("Postgres pool ended with an error", err);
      this.eventEmitter.emit("db.general.pool.end.error", { applicationName: this.applicationName, err });

      throw err;
    }
  }
}
