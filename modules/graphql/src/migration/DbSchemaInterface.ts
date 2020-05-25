export interface IDbSchema {
  schemas: string[];
  tables?: IDbTable[];
  expressions?: IDbExpression[];
  permissionViewSchema?: string | null;
  functions?: IDbFunction[];
}

export interface IDbTableOptions {
  disableSecurityBarrierForReadViews?: boolean;
  disallowGenericRootLevelAggregation?: boolean;
}

export interface IDbTable {
  id: string;
  name: string;
  schema: string;
  columns: IDbColumn[];
  indexes?: IDbIndex[];
  checks?: IDbCheck[];
  mutations?: IDbMutation[];
  options?: IDbTableOptions;
}

export interface IDbFunction {
  schema: string;
  name: string;
  definition: string;
  runAfterTables?: boolean;
}

export interface IDbColumn {
  id: string;
  type: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: any;
  queryExpressionIds: string[];
}

export interface IDbIndex {
  id: string;
  columnIds: string[];
  isUniqueIndex?: boolean;
  condition?: string;
  accessMethod?: "btree" | "hash" | "gist" | "gin" | "spgist" | "brin" | null;
}

export interface IDbCheck {
  id: string;
  definition: string;
}

export interface IDbMutation {
  id: string;
  name: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  columns: IDbMutationColumn[];
  expressionIds: string[];
  returnOnlyId?: boolean;
}

export interface IDbMutationColumn {
  columnId: string;
  isRequired?: boolean;
}

export interface IDbVariableInterface {
  key: string;
  type: string;
}

export interface IDbColumnNameVariable extends IDbVariableInterface {
  type: "COLUMN_NAME";
  columnName: string;
}

export interface IDbColumnIdVariable extends IDbVariableInterface {
  type: "COLUMN_ID";
  columnId: string;
}

export interface IDbExpressionVariable extends IDbVariableInterface {
  type: "EXPRESSION";
  expressionId: string;
}

export type IDbVariable = IDbColumnNameVariable | IDbColumnIdVariable | IDbExpressionVariable;

export interface IDbExpression {
  id: string;
  name: string;
  gqlReturnType: string;
  variables: IDbVariable[];
  authRequired?: boolean;
  excludeFromWhereClause?: boolean;
  sqlTemplate: string;
}
