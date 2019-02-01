#!/usr/bin/env node
// tslint:disable:no-console

import * as path from "path";
import * as program from "commander";
import { generate } from "../lib/generate";

program.option("-o, --output <file>", "relative path to the typescript output").parse(process.argv);

const outputFilename = program.output || "types.ts";

const projectRootMainFile = `${process.argv[1].split("node_modules/")[0]}index.ts`;
const projectRootDir = path.dirname(projectRootMainFile);
const outputPath = `${projectRootDir}/${outputFilename}`;
console.log(`Assumed ProjectRootMainFile: ${projectRootMainFile}`);
console.log(`Assumed ProjectRootDir: ${projectRootDir}`);
console.log(`Assumed OutputPath: ${outputPath}`);
console.log();

console.log(`require.main.filename: ${require.main.filename}`);
console.log(`process.argv[1]: ${process.argv[1]}`);
console.log();

console.log(`Generate typescript file and save to ${outputPath} ...`);

generate(outputPath).then(() => {
  console.log("Successfully generated typescript file.");
});
