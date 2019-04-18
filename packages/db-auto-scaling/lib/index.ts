import { Service, Inject } from "@fullstack-one/di";
import { EventEmitter } from "@fullstack-one/events";
import { BootLoader } from "@fullstack-one/boot-loader";
import { Config } from "@fullstack-one/config";
import { DbAppClient, DbGeneralPool } from "@fullstack-one/db";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";

import IDbAutoScalingConfig from "./IDbAutoScalingConfig";

@Service()
export class DbAutoScaling {
  private readonly logger: ILogger;
  private readonly config: IDbAutoScalingConfig;
  private readonly eventEmitter: EventEmitter;
  private readonly dbAppClient: DbAppClient;
  private readonly dbGeneralPool: DbGeneralPool;
  private nodeIds: string[] = [];

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((type) => EventEmitter) eventEmitter: EventEmitter,
    @Inject((type) => DbAppClient) dbAppClient: DbAppClient,
    @Inject((type) => DbGeneralPool) dbGeneralPool: DbGeneralPool
  ) {
    this.logger = loggerFactory.create(this.constructor.name);
    this.config = config.registerConfig("DbAutoScaling", `${__dirname}/../config`);
    this.eventEmitter = eventEmitter;
    this.dbAppClient = dbAppClient;
    this.dbGeneralPool = dbGeneralPool;

    this.addDbAppClientHooks();
    this.addDbGeneralPoolHooks();
    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private async boot(): Promise<void> {
    this.addEventListenersForNodeStartsAndEnds();
    await this.checkForNodeUpdates();
    this.regularlyCheckForNodeUpdates();
  }

  private addDbAppClientHooks(): void {
    this.dbAppClient.hookManager.addClientCreatedHook((applicationName: string) => {
      this.eventEmitter.emit("db.application.client.created", applicationName);
    });

    this.dbAppClient.hookManager.addClientConnectStartHook((applicationName: string) => {
      this.eventEmitter.emit("db.application.client.connect.start", applicationName);
    });

    this.dbAppClient.hookManager.addClientConnectSuccessHook((applicationName: string) => {
      this.eventEmitter.emit("db.application.client.connect.success", applicationName);
    });
    this.dbAppClient.hookManager.addClientConnectErrorHook((applicationName: string, err: any) => {
      this.eventEmitter.emit("db.application.client.connect.error", { applicationName, err });
    });

    this.dbAppClient.hookManager.addClientEndStartHook((applicationName: string) => {
      this.eventEmitter.emit("db.application.client.end.start", applicationName);
    });
    this.dbAppClient.hookManager.addClientEndSuccessHook((applicationName: string) => {
      this.eventEmitter.emit("db.application.client.end.success", applicationName);
    });
    this.dbAppClient.hookManager.addClientEndErrorHook((applicationName: string, err: any) => {
      this.eventEmitter.emit("db.application.client.end.error", { applicationName, err });
    });
  }

  private addDbGeneralPoolHooks(): void {
    this.dbGeneralPool.hookManager.addPoolCreatedHook((applicationName: string) => {
      this.eventEmitter.emit("db.general.pool.created", applicationName);
    });

    this.dbGeneralPool.hookManager.addPoolInitialConnectStartHook((applicationName: string) => {
      this.eventEmitter.emit("db.general.pool.initial.connect.start", applicationName);
    });
    this.dbGeneralPool.hookManager.addPoolInitialConnectSuccessHook((applicationName: string) => {
      this.eventEmitter.emit("db.general.pool.initial.connect.success", applicationName);
    });
    this.dbGeneralPool.hookManager.addPoolInitialConnectReleaseHook((applicationName: string) => {
      this.eventEmitter.emit("db.general.pool.initial.connect.released", applicationName);
    });
    this.dbGeneralPool.hookManager.addPoolInitialConnectErrorHook((applicationName: string, err: any) => {
      this.eventEmitter.emit("db.general.pool.initial.connect.error", { applicationName, err });
    });

    this.dbGeneralPool.hookManager.addPoolEndStartHook((applicationName: string) => {
      this.eventEmitter.emit("db.general.pool.end.start", applicationName);
    });
    this.dbGeneralPool.hookManager.addPoolEndSuccessHook((applicationName: string) => {
      // can only be caught locally (=> db connection ended)
      this.eventEmitter.emit("db.general.pool.end.success", applicationName);
    });
    this.dbGeneralPool.hookManager.addPoolEndErrorHook((applicationName: string, err: any) => {
      this.eventEmitter.emit("db.general.pool.end.error", { applicationName, err });
    });
  }

  private addEventListenersForNodeStartsAndEnds(): void {
    this.eventEmitter.onAnyInstance("db.application.client.connect.success", (nodeId) => {
      this.checkForNodeUpdates();
    });

    this.eventEmitter.onAnyInstance("db.application.client.end.start", (nodeId) => {
      // wait one tick until it actually finishes
      process.nextTick(() => {
        this.checkForNodeUpdates();
      });
    });
  }

  private regularlyCheckForNodeUpdates(): void {
    setInterval(this.checkForNodeUpdates.bind(this), this.config.updateClientListInterval);
  }

  private async checkForNodeUpdates(): Promise<void> {
    try {
      const dbName = this.dbAppClient.databaseName;
      const dbNodes = await this.dbAppClient.pgClient.query(
        `SELECT * FROM pg_stat_activity WHERE datname = '${dbName}' AND application_name LIKE '${this.dbAppClient.getApplicationNamePrefix()}%';`
      );

      const newNodeIds: [string] = dbNodes.rows.map((row) => {
        return row.application_name.replace(this.dbAppClient.getApplicationNamePrefix(), "");
      }) as [string];
      if (this.nodeIds.length !== newNodeIds.length) {
        this.dbGeneralPool.gracefullyAdjustPoolSize(newNodeIds.length);

        this.logger.debug("Postgres number connected clients changed", newNodeIds);
        this.eventEmitter.emit("db.number.of.connected.clients.changed");
      }
      this.nodeIds = newNodeIds;
    } catch (err) {
      this.logger.warn("updateNodeIdsFromDb", err);
    }
  }
}
