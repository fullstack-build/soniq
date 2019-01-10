import * as _ from "lodash";

class ConfigIntegrator {
  public static getProcessEnvironmentConfig(): any {
    const processEnvironmentConfig = {};
    _.forEach(process.env, (value: string, key: string) => {
      const parsedValue: any = this.parseTrueAndFalseToBooleans(value);
      _.set(processEnvironmentConfig, key, parsedValue);
    });
  }

  private static parseTrueAndFalseToBooleans(value: string): any {
    const lowerCaseValue = value.toLocaleLowerCase();
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }
}

export default ConfigIntegrator;
