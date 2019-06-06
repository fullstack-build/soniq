require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

import { Container } from "@fullstack-one/di";
import { FullstackOneCore } from "fullstack-one";
// import { GraphQl } from "@fullstack-one/graphql";
// import { AutoMigrate } from "@fullstack-one/auto-migrate";
import { ORM } from "@fullstack-one/db";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
// const $gql: GraphQl = Container.get(GraphQl);
// const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);
const $orm: ORM = Container.get(ORM);

import { Photo } from "./models/Photo";

(async () => {
  await $one.boot();

  console.log("### ORM");

  // const photo = new Photo();
  // photo.name = "Misha and the Bear";
  // photo.description = "I am near polar bears";
  // photo.filename = "photo-with-bears.jpg";
  // photo.views = 1;
  // // photo.isPublished = true;
  // await photo.save();
  // console.log("Photo has been saved");

  // const photo2 = new Photo();
  // photo2.name = "Photo of David";
  // photo2.description = "Am Strand";
  // photo2.filename = "photo-with-bears.jpg";
  // photo2.views = 1;
  // // photo2.isPublished = true;
  // await photo2.save();
  // console.log("Photo has been saved");

  const photos = await Photo.find();
  console.log("Loaded photos: ", JSON.stringify(photos, null, 2));
})();
