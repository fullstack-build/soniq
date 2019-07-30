require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

import { FullstackOneCore } from "fullstack-one";
import { Auth, AuthProviderEmail, AuthProviderPassword } from "@fullstack-one/auth";
import { ORM } from "@fullstack-one/db";
import { Container } from "@fullstack-one/di";
import { FileStorage } from "@fullstack-one/file-storage";
import { GraphQl } from "@fullstack-one/graphql";
import User from "./models/User";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $fs: FileStorage = Container.get(FileStorage);
const $orm: ORM = Container.get(ORM);
const $auth: Auth = Container.get(Auth);
const $gql: GraphQl = Container.get(GraphQl);
const $authProviderEmail: AuthProviderEmail = Container.get(AuthProviderEmail);
const $authProviderPassword: AuthProviderPassword = Container.get(AuthProviderPassword);

$orm.addEntity(User);

$gql.addResolvers({
  someMutation: () => {
    return "Hello Mutation";
  },
  someQuery: () => {
    return "Hello query";
  }
});

(async () => {
  await $one.boot();
})();
