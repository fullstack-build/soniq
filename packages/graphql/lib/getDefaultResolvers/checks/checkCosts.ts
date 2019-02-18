import * as crypto from "crypto";
import { PgPoolClient } from "@fullstack-one/db";

export default async function checkCosts(client: PgPoolClient, query, costLimit: number) {
  const currentCost = await getCurrentCosts(client, query);

  if (currentCost > costLimit) {
    throw new Error(
      "This query seems to be to exprensive. Please set some limits. " +
        `Costs: (current: ${currentCost}, limit: ${costLimit}, calculated: ${query.cost})`
    );
  }

  return currentCost;
}

function sha1Base64(input: string): string {
  return crypto
    .createHash("sha1")
    .update(input)
    .digest("base64");
}

const costCache = {};
const COST_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // TODO Dustin put in config

async function getCurrentCosts(client: PgPoolClient, query) {
  const queryHash: string = sha1Base64(query.sql + query.values.join(""));

  if (costCache[queryHash] != null) {
    if (costCache[queryHash].t + COST_CACHE_MAX_AGE > Date.now()) {
      return costCache[queryHash].c;
    } else {
      costCache[queryHash] = null;
      delete costCache[queryHash];
    }
  }

  const result = await client.query(`EXPLAIN ${query.sql}`, query.values);

  const queryPlan = result.rows[0]["QUERY PLAN"];

  const data: any = {};

  queryPlan
    .split("(")[1]
    .split(")")[0]
    .split(" ")
    .forEach((element) => {
      const keyValue = element.split("=");
      data[keyValue[0]] = keyValue[1];
    });

  const costs = data.cost
    .split(".")
    .filter((i) => i !== "")
    .map((i) => parseInt(i, 10));

  let currentCost = 0;

  costs.forEach((cost) => {
    currentCost = cost > currentCost ? cost : currentCost;
  });

  costCache[queryHash] = {
    c: currentCost,
    t: Date.now()
  };

  // Clean up cache
  Object.keys(costCache).forEach((key) => {
    const now = Date.now();

    if (costCache[key].time + COST_CACHE_MAX_AGE < now) {
      costCache[key] = null;
      delete costCache[key];
    }
  });

  return currentCost;
}
