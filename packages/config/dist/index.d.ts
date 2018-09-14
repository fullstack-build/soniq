import { IEnvironment } from './IEnvironment';
export { IEnvironment };
export declare class Config {
    readonly ENVIRONMENT: IEnvironment;
    private configModules;
    private projectConfig;
    private config;
    constructor(bootLoader: any);
    registerConfig(moduleName: string, moduleConfigPath: string): any;
    private requireConfigFiles;
    private applyConfig;
    private setEnvironment;
    getConfig(moduleName?: string): any;
    private deepMapHelper;
}
