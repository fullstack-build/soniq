export declare function createView(table: any, config: any, name: any, fields: any, expressions: any): any[];
export declare function createGqlField(
  name: any,
  gqlReturnType: any
): {
  kind: string;
  name: {
    kind: string;
    value: any;
  };
  arguments: any[];
  type: {
    kind: string;
    name: {
      kind: string;
      value: any;
    };
  };
  directives: any[];
};
