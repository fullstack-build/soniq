import * as ONE from 'fullstack-one';
import { Logger } from './Logger';
export { ILogger } from './ILogger';

@ONE.Service()
export class LoggerFactory {
  public create(moduleName) {
    return new Logger(moduleName);
  }
}
