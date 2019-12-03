import { Service, Container, Inject } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { Core, IModuleAppConfig, IModuleEnvConfig, PoolClient, IModuleMigrationResult, IModuleRuntimeConfig, Pool } from "@fullstack-one/core";

import * as http from "http";
// other npm dependencies
import * as Koa from "koa";
import * as compress from "koa-compress";

export { Koa };

@Service()
export class Server {
  private serverConfig;
  private server: http.Server;
  private app: Koa;
  private core: Core;

  private loggerFactory: LoggerFactory;
  private logger: ILogger;
  private ENVIRONMENT: IEnvironment;
  // private eventEmitter: EventEmitter;

  constructor(
    // @Inject(type => EventEmitter) eventEmitter?,
    @Inject((type) => LoggerFactory) loggerFactory: LoggerFactory,
    @Inject((type) => Config) config: Config,
    @Inject((tpye) => Core) core: Core
  ) {
    this.loggerFactory = loggerFactory;
    this.core = core;

    // register package config
    this.serverConfig = config.registerConfig("Server", `${__dirname}/../config`);
    // this.eventEmitter = eventEmitter;
    this.logger = this.loggerFactory.create(this.constructor.name);

    // get env from DI container
    this.ENVIRONMENT = Container.get("ENVIRONMENT");

    this.bootKoa();
    this.server = http.createServer(this.app.callback());

    this.core.addCoreFunctions({
      key: this.constructor.name,
      migrate: this.migrate.bind(this),
      boot: this.boot.bind(this)
    });
  }

  private async migrate(appConfig: IModuleAppConfig, envConfig: IModuleEnvConfig, pgClient: PoolClient): Promise<IModuleMigrationResult> {
    return {
      moduleRuntimeConfig: {},
      commands: [],
      errors: [],
      warnings: []
    };
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
      // enable compression
      this.app.use(
        compress({
          ...this.serverConfig.compression,
          flush: require("zlib").Z_SYNC_FLUSH
        })
      );

      // TODO: Add health-check Endpoint here

      // Block all requests when server has not finished booting
      this.app.use(async (ctx, next) => {
        await this.core.hasBootedPromise();
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
