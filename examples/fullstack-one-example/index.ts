// configure and read .env
require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
  // application specific logging, throwing an error, or other logic here
});

import { Container } from "@fullstack-one/di";
import { FullstackOneCore } from "fullstack-one";
import { GracefulShutdown } from "@fullstack-one/graceful-shutdown";
import { GraphQl } from "@fullstack-one/graphql";
import { AutoMigrate } from "@fullstack-one/auto-migrate";
import { DbGeneralPool } from "@fullstack-one/db";
import { DbAutoScaling } from "@fullstack-one/db-auto-scaling";
import { FileStorage } from "@fullstack-one/file-storage";
import { Auth } from "@fullstack-one/auth";
import { AuthFbToken } from "@fullstack-one/auth-fb-token";
import { NotificationsEmail } from "@fullstack-one/notifications";
import { EventEmitter } from "@fullstack-one/events";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $gql: GraphQl = Container.get(GraphQl);
const $gs: GracefulShutdown = Container.get(GracefulShutdown);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);
const $fs: FileStorage = Container.get(FileStorage);
const $auth: Auth = Container.get(Auth);
const authfbtoken: AuthFbToken = Container.get(AuthFbToken);
const $email: NotificationsEmail = Container.get(NotificationsEmail);
const $events: EventEmitter = Container.get(EventEmitter);
const $dbAutoScaling: DbAutoScaling = Container.get(DbAutoScaling);

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
  await $email.sendMessage("user@fullstack.one", "Welcome to fullstack.one", "Hello <b>User</b>!", null, [], "user@fullstack.one", {
    singletonKey: "welcome:user@fullstack.one"
  });

  // event example - multiple
  // register
  const callback = (nodeId, ...args) => {
    console.log(`(on) testEvent1 cought on instance '${nodeId}' with payload`, args);
    $events.removeListener("testEvent1", callback);
  };
  $events.on("testEvent1", callback);

  // fire three times
  $events.emit("testEvent1", 1);
  $events.emit("testEvent1", 2);
  $events.emit("testEvent1", 3);

  // event example - once (on any instance)
  // register
  $events.onceAnyInstance("testEvent2", (nodeId, ...args) => {
    console.log(`(once) testEvent2 cought on instance '${nodeId}' with payload`, args);
  });

  // fire three times
  $events.emit("testEvent2", 1);
  $events.emit("testEvent2", 2);
  $events.emit("testEvent2", 3);
})();
