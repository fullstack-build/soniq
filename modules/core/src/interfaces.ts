/* eslint-disable @typescript-eslint/no-explicit-any */
export type IModuleAppConfig = any;
export type IModuleEnvConfig = any;
export type IModuleRuntimeConfig = any;
export type IRuntimeConfig = any;

export interface IAppConfig {
  modules: IModuleConfig[];
}

export interface IModuleConfig {
  key: string;
  appConfig: IModuleAppConfig;
}
