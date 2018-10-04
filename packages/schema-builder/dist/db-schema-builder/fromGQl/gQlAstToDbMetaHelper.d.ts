export declare function setDefaultValueForColumn(gQlSchemaNode: any, dbMetaNode: any, refDbMeta: any, refDbMetaCurrentTable: any, refDbMetaCurrentTableColumn: any): void;
export declare function createConstraint(constraintName: string, constraintType: "PRIMARY KEY" | "NOT NULL" | "UNIQUE" | "CHECK", options: any, refDbMeta: any, refDbMetaCurrentTable: any, refDbMetaCurrentTableColumn?: any): void;
export declare function relationBuilderHelper(gQlDirectiveNode: any, dbMetaNode: any, refDbMeta: any, refDbMetaCurrentTable: any): void;
export declare function addMigration(gQlDirectiveNode: any, dbMetaNode: any, refDbMeta: any): void;
