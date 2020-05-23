import * as compress from "koa-compress";

export interface IServerAppConfig {
  compression: compress.CompressOptions;
}

export interface IServerAppConfigOptional {
  compression?: compress.CompressOptions;
}

export interface IServerRuntimeConfig extends IServerAppConfig {}

export interface IGetServerModuleRuntimeConfigResult {
  runtimeConfig: IServerRuntimeConfig;
  hasBeenUpdated: boolean;
}

export type TGetServerModuleRuntimeConfig = (updateKey?: string) => Promise<IGetServerModuleRuntimeConfigResult>;
