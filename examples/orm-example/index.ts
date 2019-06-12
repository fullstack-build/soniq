require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

import { Container } from "@fullstack-one/di";
import { FullstackOneCore } from "fullstack-one";
import { ORM } from "@fullstack-one/db";
import { Auth } from "@fullstack-one/auth";
import { GraphQl } from "@fullstack-one/graphql";
import { AutoMigrate } from "@fullstack-one/auto-migrate";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $orm: ORM = Container.get(ORM);
const $auth: Auth = Container.get(Auth);
const $gql: GraphQl = Container.get(GraphQl);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);

$gql.addResolvers({
  someMutation: () => {
    return "Hello Mutation";
  },
  someQuery: () => {
    return "Hello query";
  }
});

import Photo from "./models/Photo";
import User from "./models/User";

$orm.addEntity(Photo);
$orm.addEntity(User);

(async () => {
  await $one.boot();

  console.log("### ORM");

  const photo = new Photo();
  photo.name = "Misha and the Bear";
  // photo.clicks = 2;
  // photo.hasProofedEmail = true;
  // photo.views = 1;
  // photo.somethingUnique = "ciao2";
  // photo.username = "David";
  // photo.password = "test";
  // // photo.isPublished = true;
  await photo.save();
  console.log("Photo has been saved");

  // const photo2 = new Photo();
  // photo2.name = "Photo of David";
  // photo2.clicks = 3;
  // photo2.hasProofedEmail = false;
  // photo2.views = 1;
  // photo2.somethingUnique = "hallo";
  // photo2.username = "Tim";
  // photo2.password = "test";
  // // photo2.isPublished = true;
  // await photo2.save();
  // console.log("Photo has been saved");

  const user = new User();
  user.name = "David";
  user.photo = photo;
  await user.save();
  console.log("User has been saved");

  const photos = await Photo.find();
  console.log("Loaded photos: ", JSON.stringify(photos, null, 2));
  const users = await User.find();
  console.log("Loaded users: ", JSON.stringify(users, null, 2));
})();
