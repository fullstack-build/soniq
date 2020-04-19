import { randomBytes } from "crypto";
import * as path from "path";
import { IEnvironment } from "../IEnvironment";

export default class EnvironmentBuilder {
  public static readonly nodeIdLength: number = 6;

  public static buildEnvironment(
    NODE_ENV: string,
    namespace: string
  ): IEnvironment {
    const frameworkVersion: string = require("../../../package.json").version;
    const applicationRootPath: string = path.dirname(
      require.main?.filename ?? ""
    );
    const {
      applicationName,
      applicationVersion,
    } = this._getApplicationNameAndVersion(applicationRootPath);
    const nodeId: string = this._generateNodeId(
      EnvironmentBuilder.nodeIdLength
    );

    return {
      frameworkVersion,
      NODE_ENV,
      name: applicationName,
      path: applicationRootPath,
      version: applicationVersion,
      namespace,
      nodeId,
    };
  }

  private static _getApplicationNameAndVersion(
    applicationRootPath: string
  ): {
    applicationName: string | undefined;
    applicationVersion: string | undefined;
  } {
    return {
      applicationName: process.env.npm_package_name,
      applicationVersion: process.env.npm_package_version,
    };
  }

  private static _generateNodeId(length: number): string {
    return randomBytes(20 + length)
      .toString("hex")
      .substr(5, length);
  }
}
