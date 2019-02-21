export interface IQueryBuildOject {
  sql: string;
  values: any[];
  queryName: string;
  authRequired: boolean;
  potentialHighCost: boolean;
  costTree: any;
  maxDepth: number;
}

export interface IQueryClauseObject {
  where?: INestedFilter;
  orderBy?: string[] | string;
  limit?: string;
  offset?: string;
}

export interface IFilterLeaf {
  [operatorName: string]: number[] | number | string;
}

export interface INestedFilter {
  AND: Array<INestedFilter | IFilterLeaf>;
  OR: Array<INestedFilter | IFilterLeaf>;
}

export interface ICostTree {
  queryName?: string;
  subtrees: ICostTree[];
  type?: "aggregation" | "row";
  tableName?: string;
  tableSchemaName?: string;
  limit?: string;
}
