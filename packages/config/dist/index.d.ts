import { IEnvironment } from './IEnvironment';
export { IEnvironment };
export declare class Config {
    private readonly bootLoader;
    readonly ENVIRONMENT: IEnvironment;
    private configModules;
    private projectConfig;
    private config;
    private readonly myConfig;
    constructor();
    private requireConfigFiles;
    private applyConfig;
    private setEnvironment;
    registerConfig(moduleName: string, moduleConfigPath: string): any;
    getConfig(moduleName?: string): any;
    private deepMapHelper;
}
