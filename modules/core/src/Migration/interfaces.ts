/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAppConfig, IRunConfig, IModuleRunConfig } from "../moduleDefinition/interfaces";

export interface ICommand {
  sqls: string[];
  operationSortPosition: number;
  description?: string;
  autoAppConfigFixes?: IAutoAppConfigFix[];
  moduleKey?: string;
  objectId?: string;
}

export interface IAutoAppConfigFix {
  moduleKey: string;
  path: string;
  value: any;
  objectId?: string;
  message: string;
}

export interface IMigrationError {
  message: string;
  error?: any;
  command?: ICommand;
  meta?: any;
  moduleKey?: string;
  objectId?: string;
}

export interface IMigrationResult {
  errors: IMigrationError[];
  warnings: IMigrationError[];
  commands: ICommand[];
}

export interface IModuleMigrationResult extends IMigrationResult {
  moduleRunConfig: IModuleRunConfig;
}

export interface IAppMigrationResult extends IMigrationResult {
  runConfig: {
    [moduleKey: string]: IRunConfig;
  };
}

export interface IMigrationResultWithFixes extends IMigrationResult {
  autoAppConfigFixes: IAutoAppConfigFix[];
  fixedAppConfig?: IAppConfig;
}

export interface IOperatorSortPositions {
  [operatorKey: string]: number;
}

export interface IObjectTrace {
  objectId: string;
  trace: Error;
}
