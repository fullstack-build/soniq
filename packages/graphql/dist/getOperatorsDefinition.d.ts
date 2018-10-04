export declare function getOperatorsDefinition(
  operatorsObject: any
): {
  kind: string;
  name: {
    kind: string;
    value: string;
  };
  directives: any[];
  fields: {
    kind: string;
    name: {
      kind: string;
      value: any;
    };
    type:
      | {
          kind: string;
          name: {
            kind: string;
            value: any;
          };
          type?: undefined;
        }
      | {
          kind: string;
          type: {
            kind: string;
            type: {
              kind: string;
              name: {
                kind: string;
                value: string;
              };
            };
          };
          name?: undefined;
        };
    defaultValue: any;
    directives: any[];
  }[];
};
