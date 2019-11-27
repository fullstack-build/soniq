"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const example_1 = require("./example");
// const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $auth = di_1.Container.get(auth_1.Auth);
const $core = di_1.Container.get(core_1.Core);
const $gql = di_1.Container.get(graphql_1.GraphQl);
const $server = di_1.Container.get(server_1.Server);
const $authProviderEmail = di_1.Container.get(auth_1.AuthProviderEmail);
const $authProviderPassword = di_1.Container.get(auth_1.AuthProviderPassword);
$auth.registerUserRegistrationCallback((userAuthentication) => {
    console.log("user.registered", JSON.stringify(userAuthentication, null, 2));
});
$authProviderEmail.registerSendMailCallback((mail) => {
    console.error("authProviderEmail.sendMailCallback", JSON.stringify(mail, null, 2));
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Boot");
    const appConfig = {
        environments: [{
                key: "development",
                name: "Development",
                color: "green"
            }],
        modules: [{
                key: "GraphQl",
                appConfig: example_1.exampleSchema,
                envConfig: {
                    "development": {}
                }
            }, {
                key: "Auth",
                appConfig: {},
                envConfig: {
                    "development": {}
                }
            }, {
                key: "Server",
                appConfig: {},
                envConfig: {
                    "development": {}
                }
            }]
    };
    const pgConfig = {
        user: 'postgres',
        host: 'localhost',
        database: 'one-mig-2',
        password: '',
        port: 5432,
    };
    let MIGRATE = true;
    // MIGRATE = false;
    if (MIGRATE === true) {
        const res = yield $core.generateMigration("v" + Math.random(), appConfig, "development", pgConfig);
        $core.printMigrationResult(res);
        yield $core.applyMigrationResult(res, pgConfig);
    }
    else {
    }
    //*/
    // await $core.boot(pgConfig);
    // */
    /*
   await $core.boot(pgConfig);
   // */
    console.log("Fin");
}))();
