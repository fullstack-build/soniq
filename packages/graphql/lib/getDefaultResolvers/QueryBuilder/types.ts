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
