import { PoolClient } from "soniq";
import { GET_INDEXES } from "./queries";
import { ITableExtensionData } from "../ITableExtension";

export interface IIndex extends ITableExtensionData {
  table_schema: string;
  table_name: string;
  index_name: string;
  index_def: string;
}

export async function getIndexes(dbClient: PoolClient, schemas: string[]): Promise<IIndex[]> {
  const { rows } = await dbClient.query(GET_INDEXES, [schemas]);

  return rows;
}
