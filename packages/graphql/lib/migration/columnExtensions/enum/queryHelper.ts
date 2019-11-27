import { PoolClient } from "@fullstack-one/core";
import { GET_ENUM } from "./queries";

export interface IEnumEntry {
  label: string;
}

export const getEnum = async (dbClient: PoolClient, enumTypeName: string): Promise<string[]> => {
  const { rows } = await dbClient.query(GET_ENUM, [enumTypeName]);

  return rows.map((row: IEnumEntry) => {
    return row.label;
  });
};
