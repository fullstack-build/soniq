import { randomBytes } from "crypto";
import * as path from "path";

import { IEnvironment } from '../IEnvironment';

const nodeIdLength = 6;

export default class EnvironmentBuilder {

  public static buildEnvironment(): IEnvironment {

    const frameworkVersion = require("../../package.json").version;
    const applicationRootPath = path.dirname(require.main.filename);
    const { applicationName, applicationVersion } = this.getApplicationNameAndVersion(applicationRootPath);
    const namespace = require('../../config/default').namespace;
    const nodeId = this.generateNodeId(nodeIdLength);

    return {
      frameworkVersion,
      NODE_ENV: process.env.NODE_ENV,
      name: applicationName,
      path: applicationRootPath,
      version: applicationVersion,
      namespace,
      nodeId
    }
  }

  private static getApplicationNameAndVersion(applicationRootPath: string): { applicationName: string, applicationVersion: string } {
    const applicationPackageJSON = require(`${applicationRootPath}/package.json`);

    return {
      applicationName: applicationPackageJSON.name,
      applicationVersion: applicationPackageJSON.version
    }
  }

  private static generateNodeId(length: number): string {
    return randomBytes(20 + length)
      .toString("hex")
      .substr(5, length);
  }
}