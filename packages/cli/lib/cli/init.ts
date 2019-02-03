#!/usr/bin/env node
// tslint:disable:no-console

import * as program from "commander";

program.option("-a, --all", "initialize with all we have").parse(process.argv);

if (program.all) {
  console.log("Initialize all.");
} else {
  console.log("Initialize not all, but still something.");
}
