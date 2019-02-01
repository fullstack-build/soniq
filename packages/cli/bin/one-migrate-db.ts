#!/usr/bin/env node
// tslint:disable:no-console

import * as path from "path";
import * as dotenv from "dotenv";

const projectRootMainFile = `${process.argv[1].split("node_modules/")[0]}index.ts`;
const projectRootDir = path.dirname(projectRootMainFile);
console.log(`Assumed ProjectRootMainFile: ${projectRootMainFile}`);
console.log(`Assumed ProjectRootDir: ${projectRootDir}`);
console.log();

// Manipulate main file name, so @fullstack-one/config gets the config and we can get the env.
require.main.filename = projectRootMainFile;
const dotEnvPath = `${projectRootDir}/.env`;
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
