// tslint:disable:no-console

import * as program from "commander";
import * as dotenv from "dotenv";

import { Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { Auth } from "@fullstack-one/auth";
import { AuthFbToken } from "@fullstack-one/auth-fb-token";
import { FileStorage } from "@fullstack-one/file-storage";
import { SchemaBuilder, IDbMeta } from "@fullstack-one/schema-builder";

import { mapDbMetaToTypeDefinitions } from "./dbMetaToTsMapper";
import { writeFileSync } from "fs";

program.option("-o, --output <file>", "relative path to the typescript output").parse(process.argv);

const outputFilename = program.output || "types.ts";

const currentWorkDirectory = process.cwd();
const projectMainFile = `${currentWorkDirectory}/index.ts`;
const outputPath = `${currentWorkDirectory}/${outputFilename}`;
console.log(`Current work directory: ${currentWorkDirectory}`);
console.log(`Assumed project main file: ${projectMainFile}`);
console.log();

const dotEnvPath = `${currentWorkDirectory}/.env`;
dotenv.config({ path: dotEnvPath });
// Manipulate main file name, so @fullstack-one/config gets the config and we can get the env.
require.main.filename = projectMainFile;

console.log("Boot ...");
Container.get(Auth);
Container.get(AuthFbToken);
Container.get(FileStorage);
// const graphql = Container.get(GraphQl);
const schemaBuilder = Container.get(SchemaBuilder);
Container.get(BootLoader)
  .boot()
  .then(() => {
    console.log("Finished booting.");

    console.log(`Generate typescript file and save to ${outputPath} ...`);
    const dbMeta: IDbMeta = schemaBuilder.getDbMeta();
    const typeDefinitions: string = mapDbMetaToTypeDefinitions(dbMeta);

    writeFileSync(outputPath, typeDefinitions, { encoding: "utf-8" });
    process.exit(0);
  })
  .catch((err: Error) => {
    console.log(`Booting failed because of ${err.name} ${err.message} ${err.stack}`);
    process.exit(1);
  });
