import * as ONE from './index';
export interface IAbstractPackage {
    getConfig: () => ONE.IConfig | any;
}
export declare abstract class AbstractPackage implements IAbstractPackage {
    getConfig(pModuleName?: string): ONE.IConfig | any;
}
