declare const greaterThan: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const greaterThanOrEqual: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const lessThan: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
declare const lessThanOrEqual: {
  name: string;
  value: string;
  getSql: (context: any) => string;
};
export { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual };
