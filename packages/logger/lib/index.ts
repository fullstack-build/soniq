
import { Service, Inject } from '@fullstack-one/di';
import { Config } from '@fullstack-one/config';
import { Logger } from './Logger';
export { ILogger } from './ILogger';

@Service()
export class LoggerFactory {
  private config: Config;

  constructor(@Inject(type => Config) config: Config) {
    this.config = config;
  }
  public create(moduleName) {
    return new Logger(moduleName, this.config);
  }
}
