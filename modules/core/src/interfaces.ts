/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ICommand {
  sqls: string[];
  operationSortPosition: number;
  description?: string;
  autoAppConfigFixes?: IAutoAppConfigFix[];
  moduleKey?: string;
}

export interface IAutoAppConfigFix {
  path: string;
  value: any;
}

export interface IMigrationError {
  message: string;
  error?: any;
  command?: ICommand;
  meta?: any;
  moduleKey?: string;
}

export type IModuleAppConfig = any;
export type IModuleEnvConfig = any;
export type IModuleRuntimeConfig = any;
export type IRuntimeConfig = any;

export interface IModuleMigrationResult {
  moduleRuntimeConfig: IModuleRuntimeConfig;
  errors: IMigrationError[];
  warnings: IMigrationError[];
  commands: ICommand[];
}

export interface IMigrationResult {
  runtimeConfig: {
    [moduleKey: string]: IRuntimeConfig;
  };
  errors: IMigrationError[];
  warnings: IMigrationError[];
  commands: ICommand[];
}

export interface IAppConfig {
  modules: IModuleConfig[];
}

export interface IModuleConfig {
  key: string;
  appConfig: IModuleAppConfig;
}

export interface IMigrationResultWithFixes {
  errors: IMigrationError[];
  warnings: IMigrationError[];
  commands: ICommand[];
  fixedAppConfig?: IAppConfig;
  autoAppConfigFixes?: IAutoAppConfigFix[];
}

export interface IOperatorSortPositions {
  [operatorKey: string]: number;
}

export const OPERATION_SORT_POSITION: IOperatorSortPositions = {
  CREATE_SCHEMA: 1000,
  CREATE_TABLE: 2000,
  RENAME_TABLE: 3000,
  ALTER_TABLE: 4000,
  ADD_COLUMN: 5000,
  RENAME_COLUMN: 6000,
  ALTER_COLUMN: 7000,
  DROP_COLUMN: 8000,
  DROP_TABLE: 9000,
  SET_COMMENT: 10000,
  INSERT_DATA: 11000,
};
