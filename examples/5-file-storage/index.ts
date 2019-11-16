require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

import { FullstackOneCore } from "fullstack-one";
import { ORM } from "@fullstack-one/db";
import { Auth, AuthProviderEmail, AuthProviderPassword, IProofMailPayload } from "@fullstack-one/auth";
import { Container } from "@fullstack-one/di";
import { FileStorage } from "@fullstack-one/file-storage";
import { GraphQl } from "@fullstack-one/graphql";
import User from "./models/User";
import { IUserAuthentication } from "@fullstack-one/auth";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $orm: ORM = Container.get(ORM);
const $fs: FileStorage = Container.get(FileStorage);
const $auth: Auth = Container.get(Auth);
const $gql: GraphQl = Container.get(GraphQl);
const $authProviderEmail: AuthProviderEmail = Container.get(AuthProviderEmail);
const $authProviderPassword: AuthProviderPassword = Container.get(AuthProviderPassword);

$auth.registerUserRegistrationCallback((userAuthentication: IUserAuthentication) => {
  console.log("user.registered", JSON.stringify(userAuthentication, null, 2));
});

$authProviderEmail.registerSendMailCallback((mail: IProofMailPayload) => {
  console.error("authProviderEmail.sendMailCallback", JSON.stringify(mail, null, 2));
});

$orm.addEntity(User);

$gql.addResolvers({
  someMutation: () => {
    return "Hello Mutation";
  },
  someQuery: () => {
    return "Hello query";
  },
  createFileSystem: async (obj: any, args: { extension: string; type?: string }, context: { accessToken?: string }, info: any, params: {}) => {
    return $fs.createFile(args.extension, args.type);
  },
  verifyFileSystem: async (obj: any, args: { fileName: string }, context: { accessToken?: string }, info: any, params: {}) => {
    return $fs.verifyFile(args.fileName);
  }
});

(async () => {
  await $one.boot();
})();
