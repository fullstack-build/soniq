import { PoolClient } from "@fullstack-one/core";
import { GET_INDEXES } from "./queries";

export interface IIndex {
  table_schema: string;
  table_name: string;
  index_name: string;
  index_def: string;
}

export const getIndexes = async (dbClient: PoolClient, schemas: string[]): Promise<IIndex[]> => {
  const { rows } = await dbClient.query(GET_INDEXES, [schemas]);

  return rows;
};
