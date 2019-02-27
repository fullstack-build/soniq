import ava from "ava";
import resolveCreateMutation from "../lib/getDefaultResolvers/MutationBuilder/resolveCreateMutation";
import resolveUpdateMutation from "../lib/getDefaultResolvers/MutationBuilder/resolveUpdateMutation";
import resolveDeleteMutation from "../lib/getDefaultResolvers/MutationBuilder/resolveDeleteMutation";
import createTestData from "./mutationBuildTestData/createTestData";
import updateTestData from "./mutationBuildTestData/updateTestData";
import deleteTestData from "./mutationBuildTestData/deleteTestData";

ava("CREATE query", (test) => {
  const { expected, query, mutation } = createTestData;
  const actual = resolveCreateMutation(query, mutation);

  test.deepEqual(actual, expected);
});

ava("UPDATE query", (test) => {
  const { expected, query, mutation } = updateTestData;
  const actual = resolveUpdateMutation(query, mutation);

  test.deepEqual(actual, expected);
});

ava("DELETE query", (test) => {
  const { expected, query, mutation } = deleteTestData;
  const actual = resolveDeleteMutation(query, mutation);

  test.deepEqual(actual, expected);
});
