import { IFileStorageAppConfigDefaults } from "./interfaces";

export const defaultAppConfig: IFileStorageAppConfigDefaults = {
  minio: {
    region: "eu-central-1",
    port: 9000,
    useSSL: true,
  },
  maxTempFilesPerUser: 20,
};
