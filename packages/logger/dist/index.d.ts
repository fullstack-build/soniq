import { Config } from '@fullstack-one/config';
import { Logger } from './Logger';
export { ILogger } from './ILogger';
export declare class LoggerFactory {
    private config;
    constructor(config: Config);
    create(moduleName: any): Logger;
}
