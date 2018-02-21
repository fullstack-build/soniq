import { IConfig } from './IConfigObject';
import { IEnvironment } from './IEnvironment';
export { IEnvironment, IConfig };
export declare class Config {
    readonly ENVIRONMENT: IEnvironment;
    constructor();
    getConfig(pModuleName?: string): IConfig | any;
    private loadConfig();
}
