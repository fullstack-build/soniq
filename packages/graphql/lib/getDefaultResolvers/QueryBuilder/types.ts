export interface IQueryBuildOject {
  sql: string;
  values: any[];
  queryName: string;
  authRequired: boolean;
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
  AND?: INestedFilter[];
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
