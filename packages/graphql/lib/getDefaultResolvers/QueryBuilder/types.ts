export interface IQueryBuild {
  sql: string;
  values: any[];
  query: {
    name: string;
  };
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
  [operatorName: string]: number;
}

export interface INestedFilter {
  AND: Array<INestedFilter | IFilterLeaf>;
  OR: Array<INestedFilter | IFilterLeaf>;
}
