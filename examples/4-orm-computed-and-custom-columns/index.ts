require("dotenv").config();

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

import { Auth } from "@fullstack-one/auth";
import { Container } from "@fullstack-one/di";
import { ORM } from "@fullstack-one/db";
import { GraphQl } from "@fullstack-one/graphql";
import { FullstackOneCore } from "fullstack-one";

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $orm: ORM = Container.get(ORM);
const $gql: GraphQl = Container.get(GraphQl);
const $auth: Auth = Container.get(Auth);

$gql.addResolvers({
  someMutation: () => {
    return "Hello Mutation";
  },
  someQuery: () => {
    return "Hello query";
  }
});

import Task from "./models/Task";

(async () => {
  await $one.boot();

    const task = new Task();
    task.title = "Catch the train";
    await task.save();
    console.log("Task has been saved");

  const tasks = await Task.find();
  console.log("When loading tasks via the repository computed columns should appear.");
  tasks.forEach(async (task) => {
    const solved = await task.solved();
    const time = await task.time();
    console.log(JSON.stringify({ ...task, solved, time }));
  });
})();
