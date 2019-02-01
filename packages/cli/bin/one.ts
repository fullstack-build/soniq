#!/usr/bin/env node
// tslint:disable:no-console
// tslint:disable:no-var-requires
import * as program from "commander";

program
  .command("init", "init fullstack one project")
  .command("migrate-db", "migrate the database according to the schema definitions")
  .command("generate-ts", "generate types according to the schema definitions")
  .parse(process.argv);
