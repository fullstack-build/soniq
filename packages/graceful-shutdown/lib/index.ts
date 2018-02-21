
import { Service, Container, Inject } from '@fullstack-one/di';
import { Config, IEnvironment } from '@fullstack-one/config';
import { EventEmitter } from '@fullstack-one/events';
import { ILogger, LoggerFactory } from '@fullstack-one/logger';
import { DbAppClient, DbGeneralPool } from '@fullstack-one/db';
import { Server } from '@fullstack-one/server';
import { BootLoader } from '@fullstack-one/boot-loader';

// graceful exit
import * as onExit from 'signal-exit';
import * as terminus from '@godaddy/terminus';

@Service()
export class GracefulShutdown {

  private dbAppClient: DbAppClient;
  private dbPoolObj: DbGeneralPool;

  private ENVIRONMENT: IEnvironment;
  private logger: ILogger;
  private eventEmitter: EventEmitter;

  constructor(
    @Inject(type => EventEmitter) eventEmitter?,
    @Inject(type => LoggerFactory) loggerFactory?,
    @Inject(tpye => BootLoader) bootLoader?,
    @Inject(tpye => DbAppClient) dbAppClient?,
    @Inject(tpye => DbGeneralPool) dbPoolObj?,
    @Inject(tpye => Config) config?) {

    this.eventEmitter = eventEmitter;
    this.dbAppClient = dbAppClient;
    this.dbPoolObj = dbPoolObj;
    this.logger = loggerFactory.create('GracefulShutdown');

    // get settings from DI container
    this.ENVIRONMENT = Container.get('ENVIRONMENT');

    bootLoader.addBootFunction(this.boot);
  }

   private async disconnectDB() {

    try {
      // end setup pgClient and pool
      await Promise.all([
          this.dbAppClient.end(),
          this.dbPoolObj.end()
        ]);
      return true;
    } catch (err) {
      throw err;
    }

  }

  private boot() {
    terminus(Container.get(Server).getServer(), {
      // healtcheck options
      healthChecks: {
        // for now we only resolve a promise to make sure the server runs
        '/_health/liveness': () => Promise.resolve(),
        // make sure we are ready to answer requests
        '/_health/readiness': () => Container.get(BootLoader).getReadyPromise()
      },
      // cleanup options
      timeout: 1000,
      logger: this.logger.info
    });

    // release resources here before node exits
    onExit(async (exitCode, signal) => {

      if (signal) {
        this.logger.info('exiting');

        this.logger.info('starting cleanup');
        this.emit('exiting', this.ENVIRONMENT.nodeId);
        try {

          // close DB connections - has to by synchronous - no await
          // try to exit as many as possible
          this.disconnectDB();

          this.logger.info('shutting down');

          this.emit('down', this.ENVIRONMENT.nodeId);
          return true;
        } catch (err) {

          this.logger.warn('Error occurred during clean up attempt', err);
          this.emit('server.sigterm.error', this.ENVIRONMENT.nodeId, err);
          throw err;
        }
      }
      return false;
    });

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
