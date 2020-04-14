import { randomBytes } from "crypto";
import * as path from "path";

import { IEnvironment } from "../IEnvironment";

const nodeIdLength = 6;

export default class EnvironmentBuilder {
  public static buildEnvironment(
    NODE_ENV: string,
    namespace: string
  ): IEnvironment {
    const frameworkVersion = require("../../../package.json").version;
    const applicationRootPath = path.dirname(require.main?.filename ?? "");
    const {
      applicationName,
      applicationVersion,
    } = this.getApplicationNameAndVersion(applicationRootPath);
    const nodeId = this.generateNodeId(nodeIdLength);

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

  private static getApplicationNameAndVersion(
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

  private static generateNodeId(length: number): string {
    return randomBytes(20 + length)
      .toString("hex")
      .substr(5, length);
  }
}
