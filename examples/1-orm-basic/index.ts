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

  const queryRunner1 = $orm.createQueryRunner();
  await queryRunner1.connect();

  // const result = await queryRunner1.query(`SELECT * FROM "Task";`);
  // console.log(`result: ${JSON.stringify(result)}`);
  // const result2 = await queryRunner1.query(`INSERT INTO public."Task" (title) VALUES ('Test title');`);
  // console.log(`result2: ${JSON.stringify(result2)}`);

  await queryRunner1.release();

  const task = new Task();
  task.title = "Catch the flight";
  await task.save();
  console.log("Task has been saved");

  const queryRunner = $orm.getConnection().createQueryRunner();
  await queryRunner.connect();

  const tasks = await Task.find();
  console.log("Loaded tasks: ", JSON.stringify(tasks, null, 2));
})();
