#!/usr/bin/env node
// tslint:disable:no-console

import * as gqlCodeGen from "graphql-code-generator";
import { makeExecutableSchema } from "graphql-tools";
import { readFileSync } from "fs";
import { GraphQLSchema } from "graphql";
import * as path from "path";
import * as dotenv from "dotenv";

import { Container } from "@fullstack-one/di";
import { BootLoader } from "@fullstack-one/boot-loader";
import { GraphQl } from "@fullstack-one/graphql";

export async function generate(outputPath: string): Promise<void> {
  // const schemaPath = path.join(path.dirname(require.main.filename), "..", "..", "example", "schema.gql");
  const loaderPath = path.join(path.dirname(require.main.filename), "..", "lib", "loadSchema.js");
  console.log(`LoaderPath: ${loaderPath}`);
  console.log();

  const projectRootMainFile = `${process.argv[1].split("node_modules/")[0]}index.ts`;
  const projectRootDir = path.dirname(projectRootMainFile);
  console.log(`Assumed ProjectRootMainFile: ${projectRootMainFile}`);
  console.log(`Assumed ProjectRootDir: ${projectRootDir}`);
  console.log();

  // Manipulate main file name, so @fullstack-one/config gets the config and we can get the env.
  require.main.filename = projectRootMainFile;
  const dotEnvPath = `${projectRootDir}/.env`;
  dotenv.config(dotEnvPath);

  console.log();
  console.log("Boot ...");
  console.log();
  const graphql = Container.get(GraphQl);
  await Container.get(BootLoader).boot();
  console.log();
  console.log("Finished booting.");
  console.log();

  gqlCodeGen.generate(
    {
      overwrite: true,
      generates: {
        [outputPath]: {
          schema: graphql.getRuntimeSchema(),
          plugins: ["typescript-common", "typescript-server"]
        }
      }
    },
    true
  );
}

function getSchema(schemaString: string, config: any): GraphQLSchema {
  const typeDefs = getTypeDefs(schemaString);
  try {
    const executableSchema = makeExecutableSchema({ typeDefs });
    // console.log(`Executable schema: ${JSON.stringify(executableSchema)}`);
    return executableSchema;
  } catch (error) {
    // console.log(`Error happened: ${error}`);
    return null;
  }
}

function getTypeDefs(typeDefsPath: string): string {
  const schema = readFileSync(typeDefsPath, { encoding: "utf-8" });
  return `${getDirectives()}\n\n${schema}`;
}

function getDirectives() {
  return `
    directive @table on OBJECT | INPUT_OBJECT
    directive @versioning on OBJECT | INPUT_OBJECT
    directive @auth on OBJECT | INPUT_OBJECT

    directive @unique(name: String, condition: String) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    directive @username on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    directive @password on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    directive @privacyAgreementAcceptedAtInUTC on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    directive @privacyAgreementAcceptedVersion on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    directive @json on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

    directive @migrate(from: String!) on OBJECT | INPUT_OBJECT | FIELD_DEFINITION | INPUT_FIELD_DEFINITION

    directive @default(expression: String!) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

    directive @relation(name: String!, onDelete: String, onUpdate: String) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

    directive @custom(resolver: String!) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

    directive @files on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    directive @type(name: String) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

    directive @computed(expression: String!, params: JSON!) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

    directive @updatedAt on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    directive @createdAt on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
  `;
}
