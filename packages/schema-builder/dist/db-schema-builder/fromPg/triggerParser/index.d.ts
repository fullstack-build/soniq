import { IDbMeta } from "../../IDbMeta";
export declare function registerTriggerParser(callback: (trigger: any, dbMeta: IDbMeta, schemaName: string, tableName: string) => void): void;
export declare function getTriggerParser(): any;
