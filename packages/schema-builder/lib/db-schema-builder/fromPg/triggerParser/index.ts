import { IDbMeta } from "../../IDbMeta";

const triggerParser = [];

export function registerTriggerParser(callback: (trigger: any, dbMeta: IDbMeta, schemaName: string, tableName: string) => void): void {
  triggerParser.push(callback);
}

// return currently registered parser
export function getTriggerParser(): any {
  return triggerParser;
}
