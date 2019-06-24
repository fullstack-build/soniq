import ava from "ava";
import resolveCreateMutation from "../lib/getDefaultResolvers/MutationBuilder/resolveCreateMutation";
import resolveUpdateMutation from "../lib/getDefaultResolvers/MutationBuilder/resolveUpdateMutation";
import resolveDeleteMutation from "../lib/getDefaultResolvers/MutationBuilder/resolveDeleteMutation";
import createTestData from "./mutationBuildTestData/createTestData";
import updateTestData from "./mutationBuildTestData/updateTestData";
import deleteTestData from "./mutationBuildTestData/deleteTestData";
import { ReturnIdHandler } from "../lib/ReturnIdHandler";

ava("CREATE query", (test) => {
  const { expected, query, mutation } = createTestData;
  const returnIdHandler = new ReturnIdHandler({}, "id");
  const actual = resolveCreateMutation(query, mutation, returnIdHandler);

  test.deepEqual(actual, expected);
});

ava("UPDATE query", (test) => {
  const { expected, query, mutation } = updateTestData;
  const returnIdHandler = new ReturnIdHandler({}, "id");
  const actual = resolveUpdateMutation(query, mutation, returnIdHandler);

  test.deepEqual(actual, expected);
});

ava("DELETE query", (test) => {
  const { expected, query, mutation } = deleteTestData;
  const returnIdHandler = new ReturnIdHandler({}, "id");
  const actual = resolveDeleteMutation(query, mutation, returnIdHandler);

  test.deepEqual(actual, expected);
});
