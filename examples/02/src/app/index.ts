import { SoniqApp } from "soniq";
import { AuthModule, AuthProviderEmailModule, AuthProviderPasswordModule } from "@soniq/auth";
import { GraphQlModule } from "@soniq/graphql";
import { GraphqlPlaygroundModule } from "@soniq/graphql-playground";
import { ServerModule } from "@soniq/server";
import { FileStorageModule } from "@soniq/file-storage";
import { schema } from "./schema";
import { dev } from "./envs/dev";
import { prod } from "./envs/prod";

export const app: SoniqApp = new SoniqApp("a3af9ea0-11a7-4eb0-96a0-7be79f827779");
app.addEnvironments(dev, prod);

const authModule: AuthModule = new AuthModule({
  secrets: {
    admin: "HyperHyper",
    root: "ThisIsScooter",
    cookie: "FooBar",
    authProviderHashSignature: "test1234",
    encryptionKey: "qcJVt6ASy9Ew2nRV5ZbhZEzAahn8fwjL",
  },
  validOrigins: ["http://localhost:4242"],
});

const authProviderPasswortModule: AuthProviderPasswordModule = new AuthProviderPasswordModule();
const authProviderEmailModule: AuthProviderEmailModule = new AuthProviderEmailModule();

const graphqlModule: GraphQlModule = new GraphQlModule(schema, {
  introspectionActive: true,
  dangerouslyExposeErrorDetails: true,
});

const serverModule: ServerModule = new ServerModule({});

const playgroundModule: GraphqlPlaygroundModule = new GraphqlPlaygroundModule({});

const fileStorageModule: FileStorageModule = new FileStorageModule({
  minio: {
    endPoint: "play.minio.io",
    region: "us-east-1",
    port: 443,
    useSSL: true,
    accessKey: "Q3AM3UQ867SPQQA43P2F",
    secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
  },
  bucket: "sodev",
  maxTempFilesPerUser: 19,
});

app.addModules(
  authModule,
  graphqlModule,
  serverModule,
  playgroundModule,
  authProviderPasswortModule,
  authProviderEmailModule,
  fileStorageModule
);
