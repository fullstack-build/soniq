// ENV
import * as dotenv from 'dotenv-safe';
// DI
import 'reflect-metadata';
import { Container, Inject, Service } from '@fullstack-one/di';

import { randomBytes } from 'crypto';

// fullstack-one interfaces
import { IFullstackOneCore } from './IFullstackOneCore';

// fullstack.one required imports
import { BootLoader } from '@fullstack-one/boot-loader';
import { Config, IEnvironment } from '@fullstack-one/config';

// init .env -- check if all are set
try {
  dotenv.config({
    // .env.example is in fullstack-one root folder
    sample: `${__dirname}/../../../.env.example`,
  });
} catch (err) {
  process.stderr.write(err.toString() + '\n');
  process.exit(1);
}

@Service()
export class FullstackOneCore implements IFullstackOneCore {
  private bootLoader: BootLoader;
  private ENVIRONMENT: IEnvironment;

  constructor(@Inject(type => BootLoader) bootLoader?, @Inject(type => Config) config?) {
    this.ENVIRONMENT = config.ENVIRONMENT;
    this.bootLoader = bootLoader;
  }

  public async boot() {
    this.cliArt();
    return await this.bootLoader.boot();
  }

  // draw CLI art
  private cliArt(): void {
    process.stdout.write(
      '┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n' +
        '├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤ \n' +
        '└  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n',
    );
    process.stdout.write('name: ' + this.ENVIRONMENT.name + '\n');
    process.stdout.write('version: ' + this.ENVIRONMENT.version + '\n');
    process.stdout.write('path: ' + this.ENVIRONMENT.path + '\n');
    process.stdout.write('env: ' + this.ENVIRONMENT.NODE_ENV + '\n');
    process.stdout.write('port: ' + this.ENVIRONMENT.port + '\n');
    process.stdout.write('node id: ' + this.ENVIRONMENT.nodeId + '\n');
    process.stdout.write('____________________________________\n');
  }
}

// GETTER

// ONE SINGLETON
/*const $one: FullstackOneCore = Container.get(FullstackOneCore);
export function getInstance(): FullstackOneCore {
  return $one;
}

// return finished booting promise
export function getReadyPromise(): Promise<FullstackOneCore> {
  return new Promise(($resolve, $reject) => {

    // already booted?
    if ($one.isReady) {
      $resolve($one);
    } else {

      // catch ready event
      Container.get(EventEmitter).on(`${$one.ENVIRONMENT.namespace}.ready`, () => {
        $resolve($one);
      });
      // catch not ready event
      Container.get(EventEmitter).on(`${$one.ENVIRONMENT.namespace}.not-ready`, (err) => {
        $reject(err);
      });
    }

  });
}

// helper to convert an event into a promise
export function eventToPromise(pEventName: string): Promise<any> {
  return new Promise(($resolve, $reject) => {
    Container.get(EventEmitter).on(pEventName, (...args: any[]) => {
      $resolve([... args]);
    });

  });
}*/
