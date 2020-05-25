import { IDbSchema, IDbFunction } from "@fullstack-one/graphql";
import { authTablesSchema } from "./tables";

import { readFile, readdir } from "fs";

export async function generateAuthSchema(): Promise<IDbSchema> {
  const schema = JSON.parse(JSON.stringify(authTablesSchema));

  schema.functions = await loadAuthFunctions();

  return schema;
}

async function loadAuthFunctions(): Promise<IDbFunction[]> {
  const fileNames = await loadAuthFunctionList();
  const functions: IDbFunction[] = [];

  for (const fileName of fileNames) {
    const dbFunction: IDbFunction = {
      schema: "_auth",
      name: fileName.split(".")[1],
      definition: await readFunctionFile(fileName)
    };

    functions.push(dbFunction);
  }

  return functions;
}

function loadAuthFunctionList(): Promise<string[]> {
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
