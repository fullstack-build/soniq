import { PoolClient } from "soniq";
import { IColumnInfo } from "../../interfaces";
import { INTROSPECTION_QUERY } from "./queries";
import { getObjectMeta, IObjectMeta } from "../../helpers";

export async function getTableColumnsInfo(dbClient: PoolClient, schemas: string[]): Promise<IColumnInfo[]> {
  const { rows } = await dbClient.query(INTROSPECTION_QUERY, [schemas]);

  return rows.map(
    (row: IColumnInfo): IColumnInfo => {
      const objectMeta: IObjectMeta | null = getObjectMeta(row.comment);

      return {
        ...row,
        id: objectMeta != null ? objectMeta.id : null,
        type: objectMeta != null ? objectMeta.type : null,
        userComment: objectMeta != null ? objectMeta.userComment : null,
      };
    }
  );
}
