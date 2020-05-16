export interface IQueryBuildObject {
  sql: string;
  values: unknown[];
  queryName: string;
  authRequired: boolean;
  useRootViews: boolean;
  subqueryCount: number;
}

export interface IQueryClauseObject {
  where?: INestedFilter;
  orderBy?: string[] | string;
  limit?: string;
  offset?: string;
}

export interface IFilterLeaf {
  [operatorName: string]: number[] | number | string[] | string;
}

export interface INestedFilter {
  //@ts-ignore TODO: @eugene WTF?
  AND?: INestedFilter[];
  //@ts-ignore TODO: @eugene WTF?
  OR?: INestedFilter[];
  // I did not find a way to say `fieldName: string excluding "AND" | "OR"`. Thus, INestedFilter[] needed to be added.
  [fieldName: string]: IFilterLeaf | INestedFilter[];
}

export interface ICostTree {
  queryName?: string;
  subtrees: ICostTree[];
  type?: "aggregation" | "row";
  tableName?: string;
  tableSchemaName?: string;
  limit?: string;
}
