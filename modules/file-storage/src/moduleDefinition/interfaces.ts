import { IModuleAppConfig } from "soniq";

export interface IFileStorageAppConfig extends IModuleAppConfig {
  minio: {
    endPoint: string;
    region: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
  };
  bucket: string;
  maxTempFilesPerUser: number;
}

export interface IFileStorageAppConfigInput extends IModuleAppConfig {
  minio: {
    endPoint: string;
    region?: string;
    port?: number;
    useSSL?: boolean;
    accessKey: string;
    secretKey: string;
  };
  bucket: string;
  maxTempFilesPerUser?: number;
}

export interface IFileStorageAppConfigOptional extends IModuleAppConfig {
  minio?: {
    endPoint?: string;
    region?: string;
    port?: number;
    useSSL?: boolean;
    accessKey?: string;
    secretKey?: string;
  };
  bucket?: string;
  maxTempFilesPerUser?: number;
}

export interface IFileStorageAppConfigDefaults {
  minio: {
    region: string;
    port: number;
    useSSL: boolean;
  };
  maxTempFilesPerUser: number;
}

export type IFileStorageRuntimeConfig = IFileStorageAppConfig;
