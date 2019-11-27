export interface IDbSchema {
  schemas: string[];
  tables?: IDbTable[];
  expressions?: IDbExpression[];
  permissionViewSchema?: string | null;
  functions?: IDbFunction[];
}

export interface IDbTable {
  id: string;
  name: string;
  schema: string;
  columns: IDbColumn[];
  indexes?: IDbIndex[];
  checks?: IDbCheck[];
  appliedExpressions?: IDbAppliedExpression[];
  mutations?: IDbMutation[];
  options?: {
    disableSecurityBarrierForReadViews?: boolean;
    disallowGenericRootLevelAggregation?: boolean;
  };
}

export interface IDbFunction {
  schema: string;
  name: string;
  definition: string;
}

export interface IDbColumn {
  id: string;
  type: string;
  name: string;
  properties?: any;
  appliedQueryExpressionIds?: string[];
}

export interface IDbIndex {
  id: string;
  columnIds: string[];
  isUniqueIndex?: boolean;
  condition?: string;
  accessMethod?: "btree" | "hash" | "gist" | "gin" | "spgist" | "brin";
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
  appliedExpressionIds: string[];
  returnOnlyId?: boolean;
}

export interface IDbMutationColumn {
  columnId: string;
  isRequired?: boolean;
}

export interface IDbAppliedExpression {
  id: string;
  expressionId: string;
  params: {
    [placeholder: string]: string;
  };
}

export interface IDbPlaceholderInterface {
  key: string;
  type: string;
}

export interface IDbInputPlaceholder extends IDbPlaceholderInterface {
  type: "INPUT";
  inputType: "FOREIGN_TABLE" | "FOREIGN_COLUMN" | "LOCAL_COLUMN" | "STRING";
}

export interface IDbStaticPlaceholder extends IDbPlaceholderInterface {
  type: "STATIC";
  inputType: "FOREIGN_TABLE" | "FOREIGN_COLUMN" | "LOCAL_COLUMN";
  value: string;
}

export interface IDbExpressionPlaceholder extends IDbPlaceholderInterface {
  type: "EXPRESSION";
  appliedExpression: IDbAppliedExpression;
}

export type IDbPlaceholder = IDbInputPlaceholder | IDbStaticPlaceholder | IDbExpressionPlaceholder;

export interface IDbExpression {
  id: string;
  name: string;
  gqlReturnType: string;
  placeholders: IDbPlaceholder[];
  localTableId?: string;
  authRequired?: boolean;
  excludeFromWhereClause?: boolean;
  nameTemplate: string;
  sqlTemplate: string;
}
