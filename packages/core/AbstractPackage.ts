import * as ONE from './index';

export interface IAbstractPackage {
  getConfig: () => ONE.IConfig | any;
}

/*
* helpers
* */
export abstract class AbstractPackage implements IAbstractPackage {

  // return CONFIG
  // return either full config or only module config
  public getConfig(pModuleName?: string): ONE.IConfig | any {

    const config = ONE.Container.get('CONFIG');

    if (pModuleName == null) {
      // return copy instead of a ref
      return { ... config };
    } else {
      // find config key by name case insensitive
      const configKey = Object.keys(config).find(key => key.toLowerCase() === pModuleName.toLowerCase());

      // return copy instead of a ref
      return { ... config[configKey] };
    }
  }

}
