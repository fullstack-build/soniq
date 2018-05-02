import { IEnvironment } from './IEnvironment';
export { IEnvironment };
export declare class Config {
    readonly ENVIRONMENT: IEnvironment;
    private configFolder;
    private config;
    constructor(bootLoader?: any);
    getConfig(pModuleName?: string): any;
    addConfigFolder(configPath: string): void;
    private setEnvironment();
    private boot();
    private deepMapHelper(obj, callback, nestedPath?);
}
