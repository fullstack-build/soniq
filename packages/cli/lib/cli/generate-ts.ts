#!/usr/bin/env node
// tslint:disable:no-console

import * as path from "path";
import * as program from "commander";

import { generate } from "../generate";

program.option("-o, --output <file>", "relative path to the typescript output").parse(process.argv);

const outputFilename = program.output || "types.ts";

const currentWorkDirectory = process.cwd();
const projectMainFile = `${currentWorkDirectory}/index.ts`;
const outputPath = `${currentWorkDirectory}/${outputFilename}`;
console.log(`Current work director: ${currentWorkDirectory}`);
console.log(`Assumed project main file: ${projectMainFile}`);
console.log(`Output path: ${outputPath}`);
console.log();

console.log(`Generate typescript file and save to ${outputPath} ...`);

generate(outputPath)
  .then(() => {
    console.log("Successfully generated typescript file.");
    process.exit(0);
  })
  .catch((err) => {
    console.log(`Error while generating code: ${err}`);
    process.exit(1);
  });
