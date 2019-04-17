import { Service, Container, Inject } from "@fullstack-one/di";
import { IEnvironment } from "@fullstack-one/config";
import { EventEmitter } from "@fullstack-one/events";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { DbAppClient, DbGeneralPool } from "@fullstack-one/db";
import { Server } from "@fullstack-one/server";
import { BootLoader } from "@fullstack-one/boot-loader";

import * as exitHook from "async-exit-hook";
import * as terminus from "@godaddy/terminus";

type TShutdownFunction = () => Promise<void> | void;

interface IShutdownItem {
  name: string;
  fn: TShutdownFunction;
}

@Service()
export class GracefulShutdown {
  private ENVIRONMENT: IEnvironment;
  private bootLoader: BootLoader;
  private logger: ILogger;
  private eventEmitter: EventEmitter;
  private dbAppClient: DbAppClient;
  private server: Server;

  private readonly shutdownItems: IShutdownItem[] = [];

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => EventEmitter) eventEmitter: EventEmitter,
    @Inject((type) => DbAppClient) dbAppClient: DbAppClient,
    @Inject((type) => DbGeneralPool) dbGeneralPool: DbGeneralPool,
    @Inject((type) => Server) server: Server
  ) {
    this.bootLoader = bootLoader;
    this.logger = loggerFactory.create(this.constructor.name);
    this.eventEmitter = eventEmitter;
    this.dbAppClient = dbAppClient;
    this.server = server;

    // DbGeneralPool should hook in himself, when EventEmitter is no longer dependent on DbAppClient
    this.addShutdownFunction("DbGeneralPool", () => dbGeneralPool.end());

    exitHook(async (callback) => {
      await this.shutdown();
      return callback();
    });

    this.bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
  }

  private boot(): void {
    this.ENVIRONMENT = Container.get("ENVIRONMENT");
    terminus(this.server.getServer(), {
      healthChecks: {
        "/_health/liveness": () => Promise.resolve(),
        "/_health/readiness": () => this.bootLoader.getReadyPromise()
      },
      timeout: 1000,
      logger: this.logger.info
    });
  }

  private async shutdown(): Promise<void> {
    this.logger.info("shutdown.start");
    try {
      await this.emit("exiting");
    } catch (err) {
      this.logger.info("shutdown.emit.exiting.error", err);
    }

    const shutdownPromises = this.shutdownItems.reverse().map(async ({ name, fn }) => {
      this.logger.info("shutdown.function.start", name);
      try {
        await fn();
        this.logger.info("shutdown.function.end", name);
      } catch (err) {
        this.logger.info("shutdown.function.error", name, err);
      }
    });

    await Promise.all(shutdownPromises);
    this.logger.info("shutdown.end");
    try {
      await this.emit("exited");
      await this.dbAppClient.end();
    } catch (err) {
      this.logger.info("shutdown.emit.exited.error", err);
    }
  }

  private emit(eventName: string): void {
    const { namespace, nodeId } = this.ENVIRONMENT != null ? this.ENVIRONMENT : { namespace: undefined, nodeId: undefined };
    const eventNamespaceName = `${namespace}.${eventName}`;
    this.eventEmitter.emit(eventNamespaceName, nodeId);
  }

  private on(eventName: string, listener: (...args: any[]) => void) {
    const namespace = this.ENVIRONMENT != null ? this.ENVIRONMENT.namespace : undefined;
    const eventNamespaceName = `${namespace}.${eventName}`;
    this.eventEmitter.on(eventNamespaceName, listener);
  }

  public addShutdownFunction(name: string, fn: TShutdownFunction): void {
    this.shutdownItems.push({ name, fn });
  }
}
