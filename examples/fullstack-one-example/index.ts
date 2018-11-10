// configure and read .env
require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});

import { Container } from "@fullstack-one/di";
import { FullstackOneCore } from "fullstack-one";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { GraphQl } from "@fullstack-one/graphql";
import { AutoMigrate } from "@fullstack-one/auto-migrate";
import { DbGeneralPool } from "@fullstack-one/db";
import { FileStorage } from "@fullstack-one/file-storage";
import { Auth } from "@fullstack-one/auth";
import { AuthFbToken } from "@fullstack-one/auth-fb-token";
import { Email } from "@fullstack-one/notifications";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $gql: GraphQl = Container.get(GraphQl);
const $gs: GracefulShutdown = Container.get(GracefulShutdown);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);
const $fs: FileStorage = Container.get(FileStorage);
const $auth: Auth = Container.get(Auth);
const authfbtoken: AuthFbToken = Container.get(AuthFbToken);
const $email: Email = Container.get(Email);

$auth.setNotificationFunction(async (user, caller, meta) => {
  console.log("> NOTIFY!", user.userId, caller, meta);
  console.log(">", user.accessToken);
});

(async () => {
  await $one.boot();

  // normal query example
  const posts = (await $auth.adminQuery('SELECT * FROM "APost"')).rows;
  console.log("Posts query: ", posts);
  // admin query example
  await $auth.adminTransaction(async (dbClient) => {
    console.log("Posts transaction: ", (await dbClient.query('SELECT * FROM "APost"')).rows);
  });

  // send mail example
  await $email.sendMessage("user@fullstack.one", "Welcome to fullstack.one", "Hello <b>User</b>!", [], "user@fullstack.one", {
    singletonKey: "welcome:user@fullstack.one"
  });
})();
