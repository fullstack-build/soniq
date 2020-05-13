/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as _ from "lodash";
import { defaultConfig } from "./defaultConfig";
import { IMigrationError } from "soniq";

export class ConfigMergeHelper {
  public static merge(appConfig: any, envConfig: any): any {
    const runtimeConfig: any = _.defaultsDeep(
      JSON.parse(JSON.stringify(envConfig)),
      JSON.parse(JSON.stringify(appConfig)),
      JSON.parse(JSON.stringify(defaultConfig))
    );

    runtimeConfig.pgConfig.admin_token_secret = runtimeConfig.secrets.admin;
    runtimeConfig.pgConfig.root_token_secret = runtimeConfig.secrets.root;

    const errors: IMigrationError[] = this.checkForMissingConfigProperties(runtimeConfig);

    return {
      runtimeConfig,
      errors,
    };
  }

  public static checkForMissingConfigProperties(config: object): IMigrationError[] {
    const errors: IMigrationError[] = [];
    this._deepForEach(config, (key: string, val: any, nestedPath: string) => {
      if (val == null) {
        errors.push({
          message: `Missing auth config path '${nestedPath}'.`,
          meta: {
            nestedPath,
          },
        });
      }
    });

    return errors;
  }

  private static _deepForEach(
    obj: object,
    callback: (key: string, val: any, nestedPath: string) => void,
    nestedPath: string = ""
  ): any {
    Object.entries(obj).map((entry: any) => {
      const newPath: string = `${nestedPath}${entry[0]}.`;
      return typeof entry[1] === "object" && entry[1] != null
        ? this._deepForEach(entry[1], callback, newPath)
        : callback(entry[0], entry[1], newPath.slice(0, -1));
    });
  }
}
