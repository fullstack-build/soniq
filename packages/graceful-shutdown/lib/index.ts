import { Service, Container, Inject } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { EventEmitter } from "@fullstack-one/events";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { DbAppClient, DbGeneralPool } from "@fullstack-one/db";
import { Server } from "@fullstack-one/server";
import { BootLoader } from "@fullstack-one/boot-loader";

// graceful exit
import * as exitHook from "async-exit-hook";
import * as terminus from "@godaddy/terminus";

@Service()
export class GracefulShutdown {
  // TODO @Eugene: Check functionality

  private dbAppClient: DbAppClient;
  private dbPoolObj: DbGeneralPool;

  private ENVIRONMENT: IEnvironment;
  private logger: ILogger;
  private eventEmitter: EventEmitter;

  constructor(
    @Inject((type) => EventEmitter) eventEmitter,
    @Inject((type) => LoggerFactory) loggerFactory,
    @Inject((type) => BootLoader) bootLoader,
    @Inject((type) => DbAppClient) dbAppClient,
    @Inject((type) => DbGeneralPool) dbPoolObj,
    @Inject((type) => Config) config
  ) {
    this.eventEmitter = eventEmitter;
    this.dbAppClient = dbAppClient;
    this.dbPoolObj = dbPoolObj;
    this.logger = loggerFactory.create(this.constructor.name);

    bootLoader.addBootFunction(this.boot.bind(this));
  }

  private boot() {
    // get settings from DI container
    this.ENVIRONMENT = Container.get("ENVIRONMENT");

    terminus(Container.get(Server).getServer(), {
      // healtcheck options
      healthChecks: {
        // for now we only resolve a promise to make sure the server runs
        "/_health/liveness": () => Promise.resolve(),
        // make sure we are ready to answer requests
        "/_health/readiness": () => Container.get(BootLoader).getReadyPromise()
      },
      // cleanup options
      timeout: 1000,
      logger: this.logger.info
    });

    // release resources here before node exits
    exitHook(async (callback) => {
      this.logger.info("exiting");

      this.logger.info("starting cleanup");
      this.emit("exiting", this.ENVIRONMENT.nodeId);
      try {
        // close DB connections - has to by synchronous - no await
        // try to exit as many as possible
        await this.disconnectDB();

        this.logger.info("shutting down");

        this.emit("down", this.ENVIRONMENT.nodeId);
        // end exitHook
        return callback();
      } catch (err) {
        this.logger.warn("Error occurred during clean up attempt", err);
        this.emit("server.sigterm.error", this.ENVIRONMENT.nodeId, err);
        throw err;
      }
    });
  }

  private async disconnectDB() {
    try {
      // end setup pgClient and pool
      await Promise.all([this.dbAppClient.end(), this.dbPoolObj.end()]);
      return true;
    } catch (err) {
      throw err;
    }
  }

  private emit(eventName: string, ...args: any[]): void {
    // add namespace
    const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
    this.eventEmitter.emit(eventNamespaceName, this.ENVIRONMENT.nodeId, ...args);
  }

  private on(eventName: string, listener: (...args: any[]) => void) {
    // add namespace
    const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
    this.eventEmitter.on(eventNamespaceName, listener);
  }
}
