
import * as _ from "lodash";
import { defaultConfig } from "./defaultConfig";
import { IMigrationError } from "@fullstack-one/core";

export class ConfigMergeHelper {
  public static merge(appConfig, envConfig) {
    const runtimeConfig = _.defaultsDeep(JSON.parse(JSON.stringify(envConfig)), JSON.parse(JSON.stringify(appConfig)), JSON.parse(JSON.stringify(defaultConfig)));

    runtimeConfig.pgConfig.admin_token_secret = runtimeConfig.secrets.admin;

    const errors = this.checkForMissingConfigProperties(runtimeConfig);

    return {
      runtimeConfig,
      errors
    }
  }

  public static checkForMissingConfigProperties(config: object): IMigrationError[] {
    const errors: IMigrationError[] = [];
    this.deepForEach(config, (key, val, nestedPath) => {
      if (val == null) {
        errors.push({
          message: `Missing auth config path '${nestedPath}'.`,
          meta: {
            nestedPath
          }
        })
      }
    });

    return errors;
  }

  private static deepForEach(obj: object, callback: (key: string, val: any, nestedPath: string) => void, nestedPath = "") {
    Object.entries(obj).map((entry) => {
      const newPath = `${nestedPath}${entry[0]}.`;
      typeof entry[1] === "object" && entry[1] != null
        ? this.deepForEach(entry[1], callback, newPath)
        : callback(entry[0], entry[1], newPath.slice(0, -1));
    });
  }
}