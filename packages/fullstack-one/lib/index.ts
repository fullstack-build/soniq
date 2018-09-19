// DI
import 'reflect-metadata';
import { Inject, Service } from '@fullstack-one/di';

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
  private readonly ENVIRONMENT: IEnvironment;

  constructor(@Inject(type => BootLoader) bootLoader, @Inject(type => Config) config) {
    // DI
    this.config = config;
    this.bootLoader = bootLoader;

    this.ENVIRONMENT = this.config.ENVIRONMENT;

  }

  public async boot() {
    await this.bootLoader.boot();
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
