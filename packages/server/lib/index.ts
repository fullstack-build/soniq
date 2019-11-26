import { Service, Container, Inject } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";

import * as http from "http";
// other npm dependencies
import * as Koa from "koa";
import * as compress from "koa-compress";
import * as bodyParser from "koa-bodyparser";

export { Koa };

@Service()
export class Server {
  private serverConfig;
  private server: http.Server;
  private app: Koa;

  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;
  private readonly bootLoader: BootLoader;
  // private eventEmitter: EventEmitter;

  constructor(
    // @Inject(type => EventEmitter) eventEmitter?,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((tpye) => BootLoader) bootLoader: BootLoader,
    @Inject((tpye) => GracefulShutdown) gracefulShutdown: GracefulShutdown
  ) {
    this.loggerFactory = loggerFactory;
    this.bootLoader = bootLoader;

    // register package config
    this.serverConfig = config.registerConfig("Server", `${__dirname}/../config`);
    // this.eventEmitter = eventEmitter;
    this.logger = this.loggerFactory.create(this.constructor.name);

    // get env from DI container
    this.ENVIRONMENT = Container.get("ENVIRONMENT");

    this.bootKoa();
    this.server = http.createServer(this.app.callback());
    bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    gracefulShutdown.addServer(this.constructor.name, this.server);
  }

  private async boot(): Promise<void> {
    try {
      // start KOA on PORT
      this.server.listen(this.serverConfig.port);

      // emit event
      this.emit("server.up", this.serverConfig.port);

      // success log
      this.logger.info("Server listening on port", this.serverConfig.port);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(e);
    }
  }

  private bootKoa(): void {
    try {
      this.app = new Koa();

      this.app.use(bodyParser());
      // Handle errors like ECONNRESET
      this.app.on("error", (error, ctx) => {
        const bodyHidden =
          ctx.body.indexOf("createPassword") >= 0 || ctx.body.indexOf("proofPassowrd") >= 0 || ctx.body.indexOf("authFactorProofToken") >= 0;
        if (error.code === "EPIPE") {
          this.logger.warn("Koa app-level EPIPE error.", {
            error,
            originalUrl: ctx.originalUrl,
            origin: ctx.origin
          });
          this.logger.trace("Koa app-level EPIPE error. BODY TRACE", {
            bodyHidden,
            body: bodyHidden === true ? null : ctx.body
          });
          return;
        }
        if (error.code === "ECONNRESET") {
          this.logger.warn("Koa app-level ECONNRESET error.", {
            error,
            originalUrl: ctx.originalUrl,
            origin: ctx.origin
          });
          this.logger.trace("Koa app-level ECONNRESET error. BODY TRACE", {
            bodyHidden,
            body: bodyHidden === true ? null : ctx.body
          });
          return;
        }
        this.logger.warn("Koa app-level error.", {
          error,
          originalUrl: ctx.originalUrl,
          origin: ctx.origin
        });
        this.logger.trace("Koa app-level error. BODY TRACE", {
          bodyHidden,
          body: bodyHidden === true ? null : ctx.body
        });
      });
      // enable compression
      this.app.use(
        compress({
          ...this.serverConfig.compression,
          flush: require("zlib").Z_SYNC_FLUSH
        })
      );

      // Block all requests when server has not finished booting
      this.app.use(async (ctx, next) => {
        if (this.bootLoader.hasBooted() !== true) {
          return ctx.throw(503, "Service not ready yet!");
        }
        await next();
      });
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(e);
    }
  }

  private emit(eventName: string, ...args: any[]): void {
    // add namespace
    const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
    // this.eventEmitter.emit(eventNamespaceName, this.ENVIRONMENT.nodeId, ...args);
  }

  private on(eventName: string, listener: (...args: any[]) => void) {
    // add namespace
    const eventNamespaceName = `${this.ENVIRONMENT.namespace}.${eventName}`;
    // this.eventEmitter.on(eventNamespaceName, listener);
  }

  public getApp() {
    return this.app;
  }

  public getServer() {
    return this.server;
  }
}
