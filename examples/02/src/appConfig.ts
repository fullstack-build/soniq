import { IAppConfig } from "soniq";
import schema from "./schema";

export const appConfig: IAppConfig = {
  environments: [
    {
      key: "development",
      name: "Development",
      color: "green",
    },
  ],
  modules: [
    {
      key: "GraphQl",
      appConfig: schema,
      envConfig: {
        development: {
          playgroundActive: true,
          introspectionActive: true,
        },
      },
    },
    {
      key: "Auth",
      appConfig: {
        secrets: {
          admin: "HyperHyper",
          root: "ThisIsScooter",
          cookie: "FooBar",
          authProviderHashSignature: "test1234",
          encryptionKey: "qcJVt6ASy9Ew2nRV5ZbhZEzAahn8fwjL",
        },
      },
      envConfig: {
        development: {},
      },
    },
    {
      key: "Server",
      appConfig: {},
      envConfig: {
        development: {},
      },
    },
    /*,{
        key: "FileStorage",
        appConfig: {
          minio: {
            endPoint:   "play.minio.io",
            region:     "us-east-1",
            port:       443,
            useSSL:     true,
            accessKey:  "Q3AM3UQ867SPQQA43P2F",
            secretKey:  "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
          },
          bucket: "onetest"
        },
        envConfig: {
          "development": {}
        }
      }*/
  ],
};
