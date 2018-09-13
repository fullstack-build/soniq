// DI
import 'reflect-metadata';
import { Container, Inject, Service } from '@fullstack-one/di';

import { randomBytes } from 'crypto';

// fullstack-one interfaces
import { IFullstackOneCore } from './IFullstackOneCore';

// fullstack.one required imports
import { BootLoader } from '@fullstack-one/boot-loader';
import { Config, IEnvironment } from '@fullstack-one/config';

@Service()
export class FullstackOneCore implements IFullstackOneCore {
  // DI
  private config: Config;
  private bootLoader: BootLoader;
  private ENVIRONMENT: IEnvironment;

  constructor(@Inject(type => BootLoader) bootLoader, @Inject(type => Config) config) {

    // register package config
    config.addConfigFolder(__dirname + '/../config');

    this.config = config;
    this.bootLoader = bootLoader;
  }

  public async boot() {
    await this.bootLoader.boot();
    this.ENVIRONMENT = this.config.ENVIRONMENT;
    this.cliArt();
    return;
  }

  // draw CLI art
  private cliArt(): void {
    process.stdout.write(
        '  ┌─┐┬ ┬┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─ ┌─┐┌┐┌┌─┐\n' +
        '  ├┤ │ ││  │  └─┐ │ ├─┤│  ├┴┐ │ ││││├┤ \n' +
        '  └  └─┘┴─┘┴─┘└─┘ ┴ ┴ ┴└─┘┴ ┴o└─┘┘└┘└─┘\n\n',
    );
    process.stdout.write(JSON.stringify(this.ENVIRONMENT, null, 2) + '\n');
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
