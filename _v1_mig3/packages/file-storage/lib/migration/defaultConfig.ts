export const defaultConfig = {
  minio: {
    endPoint:   null,
    region:     "eu-central-1",
    port:       9000,
    useSSL:     true,
    accessKey:  null,
    secretKey:  null
  },
  bucket: null,
  pgConfig: {
    max_temp_files_per_user: 20
  }
}