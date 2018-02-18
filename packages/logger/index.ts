import * as ONE from '../core/index';
import { Logger } from './Logger';
export { ILogger } from './ILogger';

@ONE.Service()
export class LoggerFactory {
  public create(moduleName) {
    return new Logger(moduleName);
  }
}
