import { PoolClient } from "@fullstack-one/core";
import { GET_TABLES } from "./queries";
import { getObjectMeta } from "../../helpers";
import { ITableMeta } from "../../interfaces";

export const getTables = async (dbClient: PoolClient, schemas: string[]): Promise<ITableMeta[]> => {
  const { rows } = await dbClient.query(GET_TABLES, [schemas]);

  return rows.map((row) => {
    const objectMeta = getObjectMeta(row.comment);

    return {
      ...row,
      id: objectMeta != null ? objectMeta.id : null
    };
  });
};
