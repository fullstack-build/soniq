
import { Service, Inject, Container } from '@fullstack-one/di';
import { Config } from '@fullstack-one/config';
import { Logger } from './Logger';
export { ILogger } from './ILogger';

@Service()
export class LoggerFactory {
  private config: Config;
  private readonly CONFIG;

  constructor(
    @Inject(type => Config) config: Config
  ) {
    this.config = config;

    // register package config
    this.CONFIG = this.config.registerConfig('Logger', __dirname + '/../config');
  }
  public create(moduleName) {
    const env: any = Container.get('ENVIRONMENT');
    return new Logger(moduleName, this.CONFIG, env);
  }
}
