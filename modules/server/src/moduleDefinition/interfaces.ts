import * as compress from "koa-compress";

export type TCompressOptions = compress.CompressOptions;

export interface IServerAppConfig {
  compression: TCompressOptions;
}

export interface IServerAppConfigInput {
  compression?: TCompressOptions;
}
