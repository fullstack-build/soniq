import { PoolClient } from "@fullstack-one/core";
import { GET_TRIGGERS } from "./queries";

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

export const getTriggers = async (dbClient: PoolClient, tableSchema: string, tableName: string): Promise<ITrigger[]> => {
  const { rows } = await dbClient.query(GET_TRIGGERS, [tableSchema, tableName]);

  return rows;
};
