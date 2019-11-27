import { PoolClient } from "@fullstack-one/core";
import { IColumnInfo } from "../../interfaces";
import { INTROSPECTION_QUERY } from "./queries";
import { getObjectMeta } from "../../helpers";

export const getTableColumnsInfo = async (dbClient: PoolClient, schemas: string[]): Promise<IColumnInfo[]> => {
  const { rows } = await dbClient.query(INTROSPECTION_QUERY, [schemas]);

  return rows.map((row) => {
    const objectMeta = getObjectMeta(row.comment);

    return {
      ...row,
      id: objectMeta != null ? objectMeta.id : null,
      type: objectMeta != null ? objectMeta.type : null,
      userComment: objectMeta != null ? objectMeta.userComment : null
    };
  });
};
