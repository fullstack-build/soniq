import { Service, Container, Inject } from "@fullstack-one/di";
import { IEnvironment } from "@fullstack-one/config";
import { EventEmitter } from "@fullstack-one/events";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
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
  private server: Server;

  private readonly shutdownItems: IShutdownItem[] = [];

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => EventEmitter) eventEmitter: EventEmitter,
    @Inject((type) => Server) server: Server
  ) {
    this.bootLoader = bootLoader;
    this.logger = loggerFactory.create(this.constructor.name);
    this.eventEmitter = eventEmitter;
    this.server = server;

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
    this.logger.debug("shutdown.start");
    try {
      await this.eventEmitter.emit("exiting");
    } catch (err) {
      this.logger.error("shutdown.emit.exiting.error", err);
    }

    for (const shutdownItem of this.shutdownItems.reverse()) {
      const { fn, name } = shutdownItem;
      this.logger.debug("shutdown.function.start", name);
      try {
        await fn();
        this.logger.debug("shutdown.function.ended", name);
      } catch (err) {
        this.logger.error("shutdown.function.error", name, err);
      }
    }

    try {
      await this.eventEmitter.emit("exited");
    } catch (err) {
      this.logger.error("shutdown.emit.exited.error", err);
    }
    await this.eventEmitter.end();
    this.logger.debug("shutdown.end");
  }

  public addShutdownFunction(name: string, fn: TShutdownFunction): void {
    this.shutdownItems.push({ name, fn });
    this.logger.debug("shutdown.function.add", name);
  }
}
