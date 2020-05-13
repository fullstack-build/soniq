import { IDbSchema, IDbFunction } from "../index";
import { authTablesSchema } from "./tables";

import { readFile, readdir } from "fs";

function loadGraphqlMetaFunctionList(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(`${__dirname}/../../pgFunctions`, (err, fileNames) => {
      if (err) {
        return reject(err);
      }
      resolve(fileNames);
    });
  });
}

function readFunctionFile(fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(`${__dirname}/../../pgFunctions/${String(fileName)}`, { encoding: "utf-8" }, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data.toString());
    });
  });
}

async function loadGraphqlMetaFunctions(): Promise<IDbFunction[]> {
  const fileNames: string[] = await loadGraphqlMetaFunctionList();
  const functions: IDbFunction[] = [];

  for (const fileName of fileNames) {
    const dbFunction: IDbFunction = {
      schema: "_graphql_meta",
      name: fileName.split(".")[1],
      definition: await readFunctionFile(fileName),
    };

    functions.push(dbFunction);
  }

  return functions;
}

export async function generateGraphqlMetaSchema(): Promise<IDbSchema> {
  const schema: IDbSchema = JSON.parse(JSON.stringify(authTablesSchema));

  schema.functions = await loadGraphqlMetaFunctions();

  return schema;
}
