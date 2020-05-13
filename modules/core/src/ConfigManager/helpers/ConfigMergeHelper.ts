import * as _ from "lodash";

import { MissingConfigPropertiesError } from "../errors";

class ConfigMergeHelper {
  public static checkForMissingConfigProperties(moduleName: string, config: object): void {
    const missingProperties: string[] = [];
    this._deepForEach(config, (key, val, nestedPath) => {
      if (val == null) {
        missingProperties.push(nestedPath);
      }
    });

    if (missingProperties.length > 0) {
      throw new MissingConfigPropertiesError(moduleName, missingProperties);
    }
  }

  public static getProcessEnvironmentConfig(moduleName: string): object {
    const processEnvironmentConfig: object = {};

    Object.entries(process.env).forEach(([key, value]: [string, string | undefined]) => {
      if (value != null) {
        const parsedValue: boolean = this._parseTrueAndFalseToBooleans(value);
        _.set(processEnvironmentConfig, key, parsedValue);
      }
    });

    const processEnvironmentConfigOfModule: [string, string | undefined] = processEnvironmentConfig[moduleName] || {};

    return processEnvironmentConfigOfModule;
  }

  private static _parseTrueAndFalseToBooleans(value: string): boolean {
    const lowerCaseValue: string = value.toString().toLowerCase();
    return lowerCaseValue === "true";
  }

  private static _deepForEach(
    obj: object,
    callback: (key: string, val: unknown, nestedPath: string) => void,
    nestedPath: string = ""
  ): void {
    Object.entries(obj).map((entry) => {
      const newPath: string = `${nestedPath}${entry[0]}.`;
      return typeof entry[1] === "object" && entry[1] != null
        ? this._deepForEach(entry[1], callback, newPath)
        : callback(entry[0], entry[1], newPath.slice(0, -1));
    });
  }
}

export default ConfigMergeHelper;
