import { IEnvironment } from "./IEnvironment";
export { IEnvironment };
export declare class Config {
    private readonly bootLoader;
    private configModules;
    private projectConfig;
    private config;
    private readonly myConfig;
    readonly ENVIRONMENT: IEnvironment;
    constructor();
    private requireConfigFiles;
    private applyConfig;
    private setEnvironment;
    private deepMapHelper;
    registerConfig(moduleName: string, moduleConfigPath: string): any;
    getConfig(moduleName?: string): any;
}
