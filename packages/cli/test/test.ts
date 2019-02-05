import ava from "ava";
import { readFileSync } from "fs";

import { mapDbMetaToTypeDefinitions } from "../lib/generate-ts/dbMetaToTsMapper";

ava("one-generate-ts: Map dbMeta to type definitions", (test) => {
  const dbMeta = require("./data/dbmeta.json");
  const expectedTypeDefinitions: string = readFileSync(`${__dirname}/data/expectedTypeDefinitions.ts`, { encoding: "utf-8" });
  const actualTypeDefinitions: string = mapDbMetaToTypeDefinitions(dbMeta);

  test.is(actualTypeDefinitions, expectedTypeDefinitions);
});

ava.todo("one-generate-ts: boot");

ava.todo("one-migrate-db: boot");
