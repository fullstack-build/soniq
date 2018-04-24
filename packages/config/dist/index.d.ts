import { IEnvironment } from './IEnvironment';
export { IEnvironment };
export declare class Config {
    readonly ENVIRONMENT: IEnvironment;
    private configFolder;
    private config;
    constructor();
    getConfig(pModuleName?: string): any;
    addConfigFolder(configPath: string): void;
    private deepMapHelper(obj, iterator, context?);
}
