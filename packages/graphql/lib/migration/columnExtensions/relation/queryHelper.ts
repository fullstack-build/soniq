import { PoolClient } from "@fullstack-one/core";
import { GET_RELATIONS } from "./queries";

export interface IRelation {
  constraint_name: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  foreign_table_schema: string;
  foreign_table_name: string;
  foreign_column_name: string;
  is_deferrable: string;
  initially_deferred: string;
  update_rule: string;
  delete_rule: string;
}

export const getRelations = async (dbClient: PoolClient, tableSchema: string, tableName: string, columnName: string): Promise<IRelation[]> => {
  const { rows } = await dbClient.query(GET_RELATIONS, [tableSchema, tableName, columnName]);

  return rows;
};
