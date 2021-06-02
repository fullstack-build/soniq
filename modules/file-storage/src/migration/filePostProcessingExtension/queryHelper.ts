import { PoolClient } from "soniq";
import { GET_COLUMNS, GET_TRIGGERS } from "./queries";

export interface IFileColumn {
  id: string | null;
  schemaName: string;
  tableName: string;
  columnName: string;
  types: string[];
}

export const getFileColumns = async (pgClient: PoolClient, schemas: string[]): Promise<IFileColumn[]> => {
  const { rows } = await pgClient.query(GET_COLUMNS, [schemas]);

  return rows;
};

export interface ITrigger {
  trigger_catalog: string;
  trigger_schema: string;
  trigger_name: string;
  event_manipulation: string;
  event_object_catalog: string;
  event_object_schema: string;
  event_object_table: string;
  action_order: string;
  action_condition: string;
  action_statement: string;
  action_orientation: string;
  action_timing: string;
  action_reference_old_table: string;
  action_reference_new_table: string;
  action_reference_old_row: string;
  action_reference_new_row: string;
  created: string;
}

export const getTriggers = async (pgClient: PoolClient, schemas: string[]): Promise<ITrigger[]> => {
  const { rows } = await pgClient.query(GET_TRIGGERS, [schemas]);

  return rows;
};
