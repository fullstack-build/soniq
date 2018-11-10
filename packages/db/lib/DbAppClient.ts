import { Service, Inject, Container } from "@fullstack-one/di";
import { EventEmitter } from "@fullstack-one/events";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { IEnvironment, Config } from "@fullstack-one/config";
import { BootLoader } from "@fullstack-one/boot-loader";
import { IDb } from "./IDb";
import { Client as PgClient, ClientConfig as PgClientConfig, types as PgTypes } from "pg";
// stop pg from parsing dates and timestamps without timezone
PgTypes.setTypeParser(1114, (str) => str);
PgTypes.setTypeParser(1082, (str) => str);

export { PgClient };

@Service()
export class DbAppClient implements IDb {
  private applicationNamePrefix: string;
  private applicationName: string;
  // private credentials: PgClientConfig;
  private readonly credentials: any;

  // DI
  private readonly ENVIRONMENT: IEnvironment;
  private readonly config: Config;
  private readonly logger: ILogger;
  private readonly eventEmitter: EventEmitter;
  private readonly CONFIG;
  public pgClient: PgClient;

  constructor(
    @Inject((type) => BootLoader) bootLoader,
    @Inject((type) => EventEmitter) eventEmitter,
    @Inject((type) => LoggerFactory) loggerFactory,
    @Inject((type) => Config) config
  ) {
    // set DI dependencies
    this.config = config;
    this.eventEmitter = eventEmitter;

    // register package config
    this.CONFIG = this.config.registerConfig("Db", `${__dirname}/../config`);
    this.credentials = this.CONFIG.appClient;

    // get settings from DI container
    this.ENVIRONMENT = Container.get("ENVIRONMENT");
    // init logger
    this.logger = loggerFactory.create(this.constructor.name);

    // add to boot loader
    bootLoader.addBootFunction(this.boot.bind(this));
  }

  private async boot(): Promise<PgClient> {
    this.applicationNamePrefix = `${this.ENVIRONMENT.namespace}_client_`;
    this.applicationName = this.CONFIG.application_name = `${this.applicationNamePrefix}${this.ENVIRONMENT.nodeId}`;

    // create PG pgClient / add application name
    this.pgClient = new PgClient({
      ...this.credentials,
      application_name: this.applicationName
    });

    this.logger.debug("Postgres setup pgClient created");
    this.eventEmitter.emit("db.application.client.created", this.applicationName);

    // collect known nodes
    this.eventEmitter.onAnyInstance("db.application.client.connect.success", (nodeId) => {
      this.updateNodeIdsFromDb();
    });

    // update number of clients on exit
    this.eventEmitter.onAnyInstance("db.application.client.end.start", (nodeId) => {
      // wait one tick until it actually finishes
      process.nextTick(() => {
        this.updateNodeIdsFromDb();
      });
    });

    // fall back to graceful shutdown exiting, in case the event 'db.application.client.end.start' wasn't caught
    this.eventEmitter.onAnyInstance(`${this.ENVIRONMENT.namespace}.exiting`, (nodeId) => {
      // wait one tick until it actually finishes
      process.nextTick(() => {
        this.updateNodeIdsFromDb();
      });
    });

    // check connected clients every x seconds / backup in case we missed one
    const updateClientListInterval = this.CONFIG.updateClientListInterval || 10000;
    setInterval(this.updateNodeIdsFromDb.bind(this), updateClientListInterval);

    try {
      this.eventEmitter.emit("db.application.client.connect.start", this.applicationName);

      // create connection
      await this.pgClient.connect();

      this.logger.trace("Postgres setup connection created");
      this.eventEmitter.emit("db.application.client.connect.success", this.applicationName);
      // update list of known nodes // this will ad our own ID into the list
      await this.updateNodeIdsFromDb();
    } catch (err) {
      this.logger.warn("Postgres setup connection creation error", err);
      this.eventEmitter.emit("db.application.client.connect.error", this.applicationName, err);

      throw err;
    }

    return this.pgClient;
  }

  private async updateNodeIdsFromDb(): Promise<void> {
    try {
      const dbName = this.credentials.database;
      const dbNodes = await this.pgClient.query(
        `SELECT * FROM pg_stat_activity WHERE datname = '${dbName}' AND application_name LIKE '${this.applicationNamePrefix}%';`
      );

      // collect all connected node IDs
      const nodeIds: [string] = dbNodes.rows.map((row) => {
        // remove prefix from node name and keep only node ID
        return row.application_name.replace(this.applicationNamePrefix, "");
      }) as [string];

      // check if number of nodes has changed
      let knownNodeIds: string[] = [];
      try {
        // TODO: Evaluate if its a good idea to push it into container or keep it as a public readonly property of DB
        knownNodeIds = Container.get("knownNodeIds");
      } catch {
        // ignore error
      }

      if (knownNodeIds.length !== nodeIds.length) {
        knownNodeIds = nodeIds;
        // update known IDs in DI
        Container.set("knownNodeIds", knownNodeIds);

        this.logger.debug("Postgres number connected clients changed", knownNodeIds);
        this.eventEmitter.emit("connected.nodes.changed");
      }
    } catch (err) {
      this.logger.warn("updateNodeIdsFromDb", err);
    }
  }

  public async end(): Promise<void> {
    this.logger.trace("Postgres connection ending initiated");
    this.eventEmitter.emit("db.application.client.end.start", this.applicationName);

    try {
      const clientEndResult = await this.pgClient.end();

      this.logger.trace("Postgres connection ended successfully");
      // can only be caught locally (=> db connection ended)
      this.eventEmitter.emit("db.application.client.end.success", this.applicationName);

      return clientEndResult;
    } catch (err) {
      this.logger.warn("Postgres connection ended with an error", err);
      this.eventEmitter.emit("db.application.client.end.error", this.applicationName, err);

      throw err;
    }
  }
}
