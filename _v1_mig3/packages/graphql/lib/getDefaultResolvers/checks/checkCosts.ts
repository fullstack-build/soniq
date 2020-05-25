import * as crypto from "crypto";
import { PoolClient } from "@fullstack-one/core";
import { IQueryBuildObject } from "../QueryBuilder";
import { UserInputError } from "../../GraphqlErrors";

export default async function checkCosts(pgClient: PoolClient, queryBuild: IQueryBuildObject, costLimit: number) {
  const currentCost = await getCurrentCosts(pgClient, queryBuild);

  if (currentCost > costLimit) {
    throw new UserInputError(
      "This query seems to be to exprensive. Please set some limits. " + `Costs: (current: ${currentCost}, limit: ${costLimit})`,
      { exposeDetails: true }
    );
  }

  return currentCost;
}

function toSha1Base64Hash(input: string): string {
  return crypto
    .createHash("sha1")
    .update(input)
    .digest("base64");
}

const costCache = {};
const COST_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // TODO Dustin put in config

async function getCurrentCosts(pgClient: PoolClient, queryBuild: IQueryBuildObject) {
  const queryHash: string = toSha1Base64Hash(queryBuild.sql + queryBuild.values.join(""));

  if (costCache[queryHash] != null) {
    if (costCache[queryHash].t + COST_CACHE_MAX_AGE > Date.now()) {
      return costCache[queryHash].c;
    } else {
      costCache[queryHash] = null;
      delete costCache[queryHash];
    }
  }

  const result = await pgClient.query(`EXPLAIN ${queryBuild.sql}`, queryBuild.values);

  const queryPlan: string = result.rows[0]["QUERY PLAN"];

  const data: { [key: string]: string } = {};

  queryPlan
    .split("(")[1]
    .split(")")[0]
    .split(" ")
    .forEach((element) => {
      const [key, value] = element.split("=");
      data[key] = value;
    });

  const costs: number[] = data.cost
    .split(".")
    .filter((i) => i !== "")
    .map((i) => parseInt(i, 10));

  const currentCost = costs.reduce((prevCost, cost) => (cost > prevCost ? cost : prevCost), 0);

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
