declare const operators: {
  like: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  notLike: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  similarTo: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  notSimilarTo: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  posixMatchCaseSensitive: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  posixMatchCaseInsensitive: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  posixNoMatchCaseSensitive: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  posixNoMatchCaseInsensitive: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  inOperator: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  notInOperator: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  includes: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  includesNot: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  contains: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  isContainedBy: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  booleanOperator: {
    name: string;
    value: string;
    extendSchema: string;
    unsafeValue: boolean;
    getSql: (context: any) => string;
  };
  greaterThan: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  greaterThanOrEqual: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  lessThan: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  lessThanOrEqual: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  equal: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  notEqual: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  isDistinctFrom: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
  isNotDistinctFrom: {
    name: string;
    value: string;
    getSql: (context: any) => string;
  };
};
declare const operatorsObject: any;
declare const operatorKeys: any[];
export { operators, operatorKeys, operatorsObject };
