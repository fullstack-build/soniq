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
import { DbGeneralPool, ORM } from "@fullstack-one/db";
import { FileStorage } from "@fullstack-one/file-storage";
import { Auth, AuthProviderPassword, AuthProviderEmail, AuthProviderOAuth, IProofMailPayload, IUserAuthentication } from "@fullstack-one/auth";
import { NotificationsEmail } from "@fullstack-one/notifications";
import { EventEmitter } from "@fullstack-one/events";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $gql: GraphQl = Container.get(GraphQl);
const $gs: GracefulShutdown = Container.get(GracefulShutdown);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);
const $fs: FileStorage = Container.get(FileStorage);

const $orm: ORM = Container.get(ORM);

const $auth: Auth = Container.get(Auth);

$auth.registerUserRegistrationCallback((userAuthentication: IUserAuthentication) => {
  console.log("USER REGISTERED", JSON.stringify(userAuthentication, null, 2));
});

const $authProviderPassword = Container.get(AuthProviderPassword);
const $authProviderOAuth = Container.get(AuthProviderOAuth);
const $authProviderEmail = Container.get(AuthProviderEmail);

$authProviderEmail.registerSendMailCallback((mail: IProofMailPayload) => {
  console.log("SEND PROOF MAIL", JSON.stringify(mail, null, 2));
});

const $email: NotificationsEmail = Container.get(NotificationsEmail);
const $events: EventEmitter = Container.get(EventEmitter);

/* $auth.setNotificationFunction(async (user, caller, meta) => {
  console.log("> NOTIFY!", user.userId, caller, meta);
  console.log(">", user.accessToken);
}); */

// impl
import { Photo } from "./models/Photo";

(async () => {
  await $one.boot();

  // normal query example
  /* const posts = (await $auth.adminQuery('SELECT * FROM "APost"')).rows;
  console.log("Posts query: ", posts);
  // admin query example
  await $auth.adminTransaction(async (dbClient) => {
    console.log("Posts transaction: ", (await dbClient.query('SELECT * FROM "APost"')).rows);
  }); */

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
  $events.onAnyInstance("testEvent2", (nodeId, ...args) => {
    console.log(`(once) testEvent2 cought on instance '${nodeId}' with payload`, args);
  });

  // fire three times
  $events.emit("testEvent2", 1);
  $events.emit("testEvent2", 2);
  $events.emit("testEvent2", 3);

  console.log("### ORM");

  const photo = new Photo();
  photo.name = "Misha and the Bear";
  photo.description = "I am near polar bears";
  photo.filename = "photo-with-bears.jpg";
  photo.views = 1;
  photo.isPublished = true;
  await photo.save();
  console.log("Photo has been saved");

  const photo2 = new Photo();
  photo2.name = "Photo of David";
  photo2.description = "Am Strand";
  photo2.filename = "photo-with-bears.jpg";
  photo2.views = 1;
  photo2.isPublished = true;
  await photo2.save();
  console.log("Photo has been saved");
})();
