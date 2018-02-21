import { Logger } from './Logger';
export { ILogger } from './ILogger';
export declare class LoggerFactory {
    private config;
    constructor(config?: any);
    create(moduleName: any): Logger;
}
