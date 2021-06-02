import { PoolClient } from "pg";
import { getLatestNMigrations } from "./helpers";

it("getLatestNMigrations should return empty array if rows are empty", async () => {
  expect(true).toBe(true);

  const pgClient: any = {
    query: async () => {
      return {};
    },
  };

  const result = await getLatestNMigrations(pgClient, 2);

  expect(result).toEqual([]);
});

it("getLatestNMigrations should return empty array if an error is thrown", async () => {
  expect(true).toBe(true);

  const pgClient = {
    query: (qs: string, variables: string[]) => {
      return new Promise((resolve, reject) => {
        reject(new Error("Test Error"));
      });
    },
  } as PoolClient;

  const result = await getLatestNMigrations(pgClient, 2);

  expect(result).toEqual([]);
});

it("getLatestNMigrations should return the array if available", async () => {
  expect(true).toBe(true);

  const pgClient = {
    query: (qs: string, variables: string[]) => {
      return new Promise((resolve) => {
        resolve({ rows: [1, 2, 3] });
      });
    },
  } as PoolClient;

  const result = await getLatestNMigrations(pgClient, 2);

  expect(result).toEqual([1, 2, 3]);
});
