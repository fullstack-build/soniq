import ava from "ava";

import QueryBuild from "../lib/getDefaultResolvers/QueryBuilder/QueryBuild";
import simple from "./queryBuildTestData/simple";
import filterArguments from "./queryBuildTestData/filterArguments";
import relationSelect from "./queryBuildTestData/relationSelect";

ava("Simplest SELECT", (test) => {
  const { expected, resolverMeta, dbMeta, query } = simple;
  const queryBuild = new QueryBuild(resolverMeta, dbMeta, true, Infinity, query);
  const actual = queryBuild.getBuildObject();
  actual.costTree = null;

  test.deepEqual(actual, expected);
});

ava("SELECT with WHERE, ORDER BY, LIMIT, OFFSET", (test) => {
  const { expected, resolverMeta, dbMeta, query } = filterArguments;
  const queryBuild = new QueryBuild(resolverMeta, dbMeta, true, Infinity, query);
  const actual = queryBuild.getBuildObject();
  actual.costTree = null;

  test.deepEqual(actual, expected);
});

ava("SELECT with sub relation (n+1 problem solved by a single query)", (test) => {
  const { expected, resolverMeta, dbMeta, query } = relationSelect;
  const queryBuild = new QueryBuild(resolverMeta, dbMeta, true, Infinity, query);
  const actual = queryBuild.getBuildObject();
  actual.costTree = null;

  test.deepEqual(actual, expected);
});

ava.todo("SELECT with authentication");

ava.todo("SELECT with required but missing authentication");

ava.todo("Cost tree");

ava.todo("Deny expensive query");
