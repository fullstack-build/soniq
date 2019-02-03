#!/usr/bin/env node
// tslint:disable:no-console

import * as gqlCodeGen from "graphql-code-generator";
import * as path from "path";
import * as dotenv from "dotenv";

import { Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GraphQl } from "@fullstack-one/graphql";
import { Auth } from "@fullstack-one/auth";
import { AuthFbToken } from "@fullstack-one/auth-fb-token";
import { FileStorage } from "@fullstack-one/file-storage";

console.log(`\n\nHello world\n\n`);

export async function generate(outputPath: string): Promise<void> {
  // const schemaPath = path.join(path.dirname(require.main.filename), "..", "..", "example", "schema.gql");
  const loaderPath = path.join(path.dirname(require.main.filename), "..", "lib", "loadSchema.js");
  console.log(`LoaderPath: ${loaderPath}`);
  console.log();

  const currentWorkDirectory = process.cwd();
  const projectMainFile = `${currentWorkDirectory}/index.ts`;
  console.log(`Current work director: ${currentWorkDirectory}`);
  console.log(`Assumed project main file: ${projectMainFile}`);
  console.log();

  // Manipulate main file name, so @fullstack-one/config gets the config and we can get the env.
  require.main.filename = projectMainFile;
  const dotEnvPath = `${currentWorkDirectory}/.env`;
  dotenv.config(dotEnvPath);

  console.log();
  console.log("Boot ...");
  console.log();
  Container.get(Auth);
  Container.get(AuthFbToken);
  Container.get(FileStorage);
  const graphql = Container.get(GraphQl);
  await Container.get(BootLoader).boot();
  console.log();
  console.log("Finished booting.");
  console.log();

  const runtimeSchema = graphql.getRuntimeSchema();

  console.log();
  console.log(`Runtime schema: ${runtimeSchema}`);
  console.log();

  console.log(`Generate code to ${outputPath} ...`);
  await gqlCodeGen.generate(
    {
      overwrite: true,
      silent: true,
      generates: {
        [outputPath]: {
          schema: runtimeSchema,
          plugins: ["typescript-common", "typescript-server"]
        }
      }
    },
    true
  );
}
