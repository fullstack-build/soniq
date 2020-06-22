import * as compress from "koa-compress";
import { Koa } from ".";

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

export type TAddKoaMiddleware = (middleware: Koa.Middleware) => void;

export interface IServerExtensionConnector {
  addKoaMiddleware: TAddKoaMiddleware;
}
