"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection:", reason);
});
const di_1 = require("@fullstack-one/di");
// import { FullstackOneCore } from "fullstack-one";
const core_1 = require("@fullstack-one/core");
const graphql_1 = require("@fullstack-one/graphql");
const auth_1 = require("@fullstack-one/auth");
const server_1 = require("@fullstack-one/server");
const file_storage_1 = require("@fullstack-one/file-storage");
const example_1 = require("./example");
exports.exampleSchema = example_1.exampleSchema;
// const $one: FullstackOneCore = Container.get(FullstackOneCore);
exports.$auth = di_1.Container.get(auth_1.Auth);
exports.$core = di_1.Container.get(core_1.Core);
exports.$gql = di_1.Container.get(graphql_1.GraphQl);
exports.$server = di_1.Container.get(server_1.Server);
exports.$authProviderEmail = di_1.Container.get(auth_1.AuthProviderEmail);
exports.$authProviderPassword = di_1.Container.get(auth_1.AuthProviderPassword);
exports.$fileStorage = di_1.Container.get(file_storage_1.FileStorage);
exports.$auth.registerUserRegistrationCallback((userAuthentication) => {
    console.log("user.registered", JSON.stringify(userAuthentication, null, 2));
});
exports.$authProviderEmail.registerSendMailCallback((mail) => {
    console.error("authProviderEmail.sendMailCallback", JSON.stringify(mail, null, 2));
});
exports.appConfig = {
    environments: [{
            key: "development",
            name: "Development",
            color: "green"
        }],
    modules: [{
            key: "GraphQl",
            appConfig: example_1.exampleSchema,
            envConfig: {
                "development": {
                    playgroundActive: true,
                    introspectionActive: true
                }
            }
        }, {
            key: "Auth",
            appConfig: {
                secrets: {
                    admin: "HyperHyper",
                    root: "ThisIsScooter",
                    cookie: "FooBar",
                    authProviderHashSignature: "test1234",
                    encryptionKey: "qcJVt6ASy9Ew2nRV5ZbhZEzAahn8fwjL",
                }
            },
            envConfig: {
                "development": {}
            }
        }, {
            key: "Server",
            appConfig: {},
            envConfig: {
                "development": {}
            }
        }, {
            key: "FileStorage",
            appConfig: {
                minio: {
                    endPoint: "play.minio.io",
                    region: "us-east-1",
                    port: 443,
                    useSSL: true,
                    accessKey: "Q3AM3UQ867SPQQA43P2F",
                    secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
                },
                bucket: "onetest"
            },
            envConfig: {
                "development": {}
            }
        }]
};
exports.pgConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'one-mig-4',
    password: '',
    port: 5432,
};
