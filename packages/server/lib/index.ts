
import { Service, Container, Inject } from '@fullstack-one/di';
import { Config, IEnvironment } from '@fullstack-one/config';
// import { EventEmitter } from '@fullstack-one/events';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { BootLoader } from '@fullstack-one/boot-loader';

import * as http from 'http';
// other npm dependencies
import * as Koa from 'koa';

@Service()
export class Server {

  private server: http.Server;
  private app: Koa;

  private ENVIRONMENT: IEnvironment;
  private logger: ILogger;
  // private eventEmitter: EventEmitter;

  constructor(
    // @Inject(type => EventEmitter) eventEmitter?,
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(type => Config) config?,
    @Inject(tpye => BootLoader) bootLoader?) {

    // this.eventEmitter = eventEmitter;
    this.logger = loggerFactory.create('Server');

    // get settings from DI container
    this.ENVIRONMENT = Container.get('ENVIRONMENT');

    // bootLoader.addBootFunction(this.boot.bind(this));
    this.boot();
  }

  public getApp() {
    return this.app;
  }

  public getServer() {
    return this.server;
  }

  private async boot(): Promise<void> {
    try {
    this.app = new Koa();

    // start KOA on PORT
    this.server = http.createServer(this.app.callback()).listen(this.ENVIRONMENT.port);

    // emit event
    this.emit('server.up', this.ENVIRONMENT.port);
    // success log
    this.logger.info('Server listening on port', this.ENVIRONMENT.port);
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

}
