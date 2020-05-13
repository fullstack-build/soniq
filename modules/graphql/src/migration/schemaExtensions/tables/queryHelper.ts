import { PoolClient } from "soniq";
import { GET_TABLES } from "./queries";
import { getObjectMeta, IObjectMeta } from "../../helpers";
import { ITableMeta } from "../../interfaces";

export async function getTables(dbClient: PoolClient, schemas: string[]): Promise<ITableMeta[]> {
  const { rows } = await dbClient.query(GET_TABLES, [schemas]);

  return rows.map(
    (row: ITableMeta): ITableMeta => {
      const objectMeta: IObjectMeta | null = getObjectMeta(row.comment);

      return {
        ...row,
        id: objectMeta != null ? objectMeta.id : null,
      };
    }
  );
}
