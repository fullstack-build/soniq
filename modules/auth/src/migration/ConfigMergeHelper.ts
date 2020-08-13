import * as _ from "lodash";
import { defaultConfig } from "./defaultConfig";
import { IMigrationError } from "soniq";
import { IAuthApplicationConfig } from "../interfaces";

export class ConfigMergeHelper {
  public static merge(
    appConfig: unknown,
    envConfig: unknown
  ): {
    runtimeConfig: IAuthApplicationConfig;
    errors: IMigrationError[];
  } {
    const runtimeConfig: IAuthApplicationConfig = _.defaultsDeep(
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
    this._deepForEach(config, (key: string, val: unknown, nestedPath: string) => {
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
    callback: (key: string, val: unknown, nestedPath: string) => void,
    nestedPath: string = ""
  ): void {
    Object.entries(obj).map((entry: [string, unknown]) => {
      const newPath: string = `${nestedPath}${entry[0]}.`;
      return typeof entry[1] === "object" && entry[1] != null
        ? this._deepForEach(entry[1], callback, newPath)
        : callback(entry[0], entry[1], newPath.slice(0, -1));
    });
  }
}
