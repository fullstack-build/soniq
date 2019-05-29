import { Service, Inject } from "@fullstack-one/di";
import { EventEmitter } from "@fullstack-one/events";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
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
  private bootLoader: BootLoader;
  private logger: ILogger;
  private eventEmitter: EventEmitter;

  private readonly shutdownItems: IShutdownItem[] = [];

  constructor(
    @Inject((type) => BootLoader) bootLoader: BootLoader,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => EventEmitter) eventEmitter: EventEmitter
  ) {
    this.bootLoader = bootLoader;
    this.logger = loggerFactory.create(this.constructor.name);
    this.eventEmitter = eventEmitter;

    exitHook(async (callback) => {
      await this.shutdown();
      return callback();
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

  public addServer<TServer>(name: string, server: TServer): void {
    terminus(server, {
      healthChecks: {
        "/_health/liveness": () => Promise.resolve(),
        "/_health/readiness": () => this.bootLoader.getReadyPromise()
      },
      timeout: 1000,
      logger: this.logger.info
    });
    this.logger.debug("shutdown.server.addTerminus", name);
  }
}
