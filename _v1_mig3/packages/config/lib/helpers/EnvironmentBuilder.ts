import { randomBytes } from "crypto";
import * as path from "path";

import { IEnvironment } from "../IEnvironment";

const nodeIdLength = 6;

// TODO: Needs to be rewritten to actually look for the latest framework version
export default class EnvironmentBuilder {
  public static buildEnvironment(NODE_ENV: string, namespace: string): IEnvironment {
    const applicationRootPath = path.dirname(require.main.filename);
    const frameworkVersion = require(path.join(applicationRootPath, "..", "package.json")).version;
    const { applicationName, applicationVersion } = this.getApplicationNameAndVersion(applicationRootPath);
    const nodeId = this.generateNodeId(nodeIdLength);

    return {
      frameworkVersion,
      NODE_ENV,
      name: applicationName,
      path: applicationRootPath,
      version: applicationVersion,
      namespace,
      nodeId
    };
  }

  private static getApplicationNameAndVersion(applicationRootPath: string): { applicationName: string; applicationVersion: string } {
    const applicationPackageJSON = require(path.join(applicationRootPath, "..", "package.json"));

    return {
      applicationName: applicationPackageJSON.name,
      applicationVersion: applicationPackageJSON.version
    };
  }

  private static generateNodeId(length: number): string {
    return randomBytes(20 + length)
      .toString("hex")
      .substr(5, length);
  }
}
