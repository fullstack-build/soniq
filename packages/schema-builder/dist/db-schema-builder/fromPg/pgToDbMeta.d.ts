import { IDbMeta } from "../IDbMeta";
export { registerQueryParser } from "./queryParser";
export { registerTriggerParser } from "./triggerParser";
export declare class PgToDbMeta {
  private readonly DELETED_PREFIX;
  private readonly KNOWN_TYPES;
  private dbAppClient;
  private readonly dbMeta;
  constructor(dbAppClient?: any);
  private iterateAndAddSchemas;
  private iterateEnumTypes;
  private iterateAndAddTables;
  private iterateAndAddColumns;
  private iterateAndAddConstraints;
  private addConstraint;
  private addCheck;
  private iterateAndAddTriggers;
  private relationBuilderHelper;
  private manyToManyRelationBuilderHelper;
  getPgDbMeta(): Promise<IDbMeta>;
}
