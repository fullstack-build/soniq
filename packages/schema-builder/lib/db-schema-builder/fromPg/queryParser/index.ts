import { IDbMeta } from "../../IDbMeta";
import { PostgresQueryRunner } from "@fullstack-one/db";

export type TQueryParser = (queryRunner: PostgresQueryRunner, dbMeta: IDbMeta) => void;

const queryParsers: TQueryParser[] = [];

export function registerQueryParser(queryParser: TQueryParser): void {
  queryParsers.push(queryParser);
}

export function getQueryParser(): TQueryParser[] {
  return queryParsers;
}
