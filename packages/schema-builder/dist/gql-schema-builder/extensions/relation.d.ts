export declare function parseReadField(
  ctx: any
): {
  gqlFieldName: any;
  nativeFieldName: any;
  publicFieldSql: any;
  authFieldSql: any;
  gqlFieldDefinition: any;
  meta: {
    foreignGqlTypeName: any;
    isListType: boolean;
    isNonNullType: boolean;
    relationName: any;
    table: {
      gqlTypeName: any;
      schemaName: any;
      tableName: any;
    };
  };
}[];
export declare function parseUpdateField(ctx: any): any[];
export declare function parseCreateField(ctx: any): any[];
