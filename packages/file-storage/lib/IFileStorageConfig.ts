export default interface IFileStorageConfig {
  minio: {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
  };
  bucket: string;
}
