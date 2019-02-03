#!/usr/bin/env node
// tslint:disable:no-console

import * as dotenv from "dotenv";

const currentWorkDirectory = process.cwd();
const projectMainFile = `${currentWorkDirectory}/index.ts`;
console.log(`Current work directory: ${currentWorkDirectory}`);
console.log(`Assumed ProjectRootMainFile: ${projectMainFile}`);
console.log();

// Manipulate main file name, so @fullstack-one/config gets the config and we can get the env.
require.main.filename = projectMainFile;
const dotEnvPath = `${currentWorkDirectory}/.env`;
dotenv.config(dotEnvPath);

import { Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { AutoMigrate } from "@fullstack-one/auto-migrate";

const $bootLoader: BootLoader = Container.get(BootLoader);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);

console.log();
console.log("Start booting including migration of db by auto-migrate ...");
console.log();
$bootLoader.boot().then(() => {
  console.log();
  console.log("Finished booting and db migration.");
  process.exit();
});
