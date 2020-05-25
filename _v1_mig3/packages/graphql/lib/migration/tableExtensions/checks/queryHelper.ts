import { PoolClient } from "@fullstack-one/core";
import { GET_CHECKS } from "./queries";

export interface ICheck {
  constraint_name: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  definition: string;
}

export const getChecks = async (dbClient: PoolClient, schemas: string[]): Promise<ICheck[]> => {
  const { rows } = await dbClient.query(GET_CHECKS, [schemas]);

  return rows;
};
