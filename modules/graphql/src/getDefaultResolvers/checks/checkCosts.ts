import * as crypto from "crypto";
import { PoolClient, QueryResult } from "soniq";
import { IQueryBuildObject } from "../QueryBuilder";
import { UserInputError } from "../../GraphqlErrors";

interface ICostCache {
  [queryHash: string]: {
    c: number;
    t: number;
  };
}

const costCache: ICostCache = {};
const COST_CACHE_MAX_AGE: number = 24 * 60 * 60 * 1000; // TODO Dustin put in config

function toSha1Base64Hash(input: string): string {
  return crypto.createHash("sha1").update(input).digest("base64");
}

async function getCurrentCosts(pgClient: PoolClient, queryBuild: IQueryBuildObject): Promise<number> {
  const queryHash: string = toSha1Base64Hash(queryBuild.sql + queryBuild.values.join(""));

  if (costCache[queryHash] != null) {
    if (costCache[queryHash].t + COST_CACHE_MAX_AGE > Date.now()) {
      return costCache[queryHash].c;
    } else {
      //@ts-ignore TODO: @eugene This is okey, because I delete this afterwards (By setting it to null the garbage-collector will free up its memory)
      costCache[queryHash] = null;
      delete costCache[queryHash];
    }
  }

  const result: QueryResult = await pgClient.query(`EXPLAIN ${queryBuild.sql}`, queryBuild.values);

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

  const currentCost: number = costs.reduce((prevCost, cost) => (cost > prevCost ? cost : prevCost), 0);

  // eslint-disable-next-line require-atomic-updates
  costCache[queryHash] = {
    c: currentCost,
    t: Date.now(),
  };

  // Clean up cache
  Object.keys(costCache).forEach((key) => {
    const now: number = Date.now();

    if (costCache[key].t + COST_CACHE_MAX_AGE < now) {
      //@ts-ignore TODO: @eugene This is okey, because I delete this afterwards (By setting it to null the garbage-collector will free up its memory)
      costCache[key] = null;
      delete costCache[key];
    }
  });

  return currentCost;
}

export default async function checkCosts(
  pgClient: PoolClient,
  queryBuild: IQueryBuildObject,
  costLimit: number
): Promise<number> {
  const currentCost: number = await getCurrentCosts(pgClient, queryBuild);

  if (currentCost > costLimit) {
    throw new UserInputError(
      "This query seems to be to expensive. Please set some limits. " +
        `Costs: (current: ${currentCost}, limit: ${costLimit})`
    );
  }

  return currentCost;
}
