require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

import { Container } from "@fullstack-one/di";
// import { FullstackOneCore } from "fullstack-one";
import { Core } from "@fullstack-one/core";
import { GraphQl } from "@fullstack-one/graphql";
import { Auth, AuthProviderEmail, AuthProviderPassword, IUserAuthentication, IProofMailPayload } from "@fullstack-one/auth";
import { Server } from "@fullstack-one/server";
import { IAppConfig } from "@fullstack-one/core/lib/interfaces";
import { FileStorage } from "@fullstack-one/file-storage";

import { exampleSchema } from "./example";

export { exampleSchema };

// const $one: FullstackOneCore = Container.get(FullstackOneCore);
export const $auth: Auth = Container.get(Auth);
export const $core: Core = Container.get(Core);
export const $gql: GraphQl = Container.get(GraphQl);
export const $server: Server = Container.get(Server);
export const $authProviderEmail: AuthProviderEmail = Container.get(AuthProviderEmail);
export const $authProviderPassword: AuthProviderPassword = Container.get(AuthProviderPassword);
export const $fileStorage: AuthProviderPassword = Container.get(FileStorage);

$auth.registerUserRegistrationCallback((userAuthentication: IUserAuthentication) => {
  console.log("user.registered", JSON.stringify(userAuthentication, null, 2));
});

$authProviderEmail.registerSendMailCallback((mail: IProofMailPayload) => {
  console.error("authProviderEmail.sendMailCallback", JSON.stringify(mail, null, 2));
});

export const appConfig: IAppConfig = {
  environments: [{
    key: "development",
    name: "Development",
    color: "green"
  }],
  modules: [{
    key: "GraphQl",
    appConfig: exampleSchema,
    envConfig: {
      "development": {
        playgroundActive: true,
        introspectionActive: true
      }
    }
  },{
    key: "Auth",
    appConfig: {
      secrets: {
        admin: "HugoBosssdkhfk",
        cookie: "FooBar",
        authProviderHashSignature: "test1234",
        encryptionKey: "qcJVt6ASy9Ew2nRV5ZbhZEzAahn8fwjL",
      }
    },
    envConfig: {
      "development": {}
    }
  },{
    key: "Server",
    appConfig: {},
    envConfig: {
      "development": {}
    }
  },{
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
  }]
}

export const pgConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'one-mig-2',
  password: '',
  port: 5432,
};
