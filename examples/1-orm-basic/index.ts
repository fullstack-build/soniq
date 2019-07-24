require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

import { Container } from "@fullstack-one/di";
import { FullstackOneCore } from "fullstack-one";
import { ORM } from "@fullstack-one/db";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $orm: ORM = Container.get(ORM);

import Task from "./models/Task";

(async () => {
  await $one.boot();

  const task = new Task();
  task.title = "Catch the flight";
  task.solved = "false";
  await task.save();
  console.log("Task has been saved");

  const tasks = await Task.find();
  console.log("Loaded tasks: ", JSON.stringify(tasks, null, 2));
})();
