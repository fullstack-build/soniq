import { IObjectTrace } from "../migration/interfaces";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type IModuleAppConfig = any;
export type IModuleEnvConfig = any;
export type IModuleRunConfig = any;
export type IRunConfig = any;

export interface IAppConfig {
  modules: IModuleConfig[];
}

export interface IModuleConfig {
  key: string;
  appConfig: IModuleAppConfig;
}

export interface IApplicationConfig {
  appConfig: IAppConfig;
  objectTraces: IObjectTrace[];
}
