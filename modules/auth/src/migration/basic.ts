import { IDbSchema, IDbFunction } from "@soniq/graphql";
import { authTablesSchema } from "./tables";

import { readFile, readdir } from "fs";

function loadAuthFunctionList(): Promise<string[]> {
  return new Promise((resolve: (fileNames: string[]) => void, reject: (err: NodeJS.ErrnoException | null) => void) => {
    readdir(`${__dirname}/../../pgFunctions`, (err: NodeJS.ErrnoException | null, fileNames: string[]) => {
      if (err) {
        return reject(err);
      }
      resolve(fileNames);
    });
  });
}

function readFunctionFile(fileName: string): Promise<string> {
  return new Promise((resolve: (fileNames: string) => void, reject: (err: NodeJS.ErrnoException | null) => void) => {
    readFile(
      `${__dirname}/../../pgFunctions/${String(fileName)}`,
      { encoding: "utf-8" },
      (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          return reject(err);
        }
        resolve(data.toString());
      }
    );
  });
}

async function loadAuthFunctions(): Promise<IDbFunction[]> {
  const fileNames: string[] = await loadAuthFunctionList();
  const functions: IDbFunction[] = [];

  for (const fileName of fileNames) {
    const dbFunction: IDbFunction = {
      schema: "_auth",
      name: fileName.split(".")[1],
      definition: await readFunctionFile(fileName),
    };

    functions.push(dbFunction);
  }

  return functions;
}

export async function generateAuthSchema(): Promise<IDbSchema> {
  const schema: IDbSchema = JSON.parse(JSON.stringify(authTablesSchema));

  schema.functions = await loadAuthFunctions();

  return schema;
}
