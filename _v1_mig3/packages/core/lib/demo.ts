import { Pool, PoolClient, PoolConfig, QueryResult } from "pg";

export const pgConfig = {
  user: "postgres",
  host: "localhost",
  database: "one-mig-3",
  password: "",
  port: 5432
};

const foo = async () => {
  console.log("Start");
  console.time("TOTAL");
  const pgPool = new Pool(pgConfig);

  const pgClient = await pgPool.connect();

  console.log("Start 1");
  const res1a = pgClient.query("SELECT pg_sleep(3), '1';");

  console.log("Start 2");
  const res2a = pgClient.query("SELECT pg_sleep(3), '2';");

  console.log("Start 3");
  const res3a = pgClient.query("SELECT pg_sleep(3), '3';");

  console.log("Await 1");
  const res1 = await res1a;
  console.log("Await 2");
  const res2 = await res2a;
  console.log("Await 3");
  const res3 = await res3a;

  console.log("R1", res1.rows);
  console.log("R2", res2.rows);
  console.log("R3", res3.rows);

  pgClient.release();

  pgPool.end();
  console.timeEnd("TOTAL");
};

foo();
