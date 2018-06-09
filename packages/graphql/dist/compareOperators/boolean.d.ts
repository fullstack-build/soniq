declare const booleanOperator: {
    name: string;
    value: string;
    extendSchema: string;
    unsafeValue: boolean;
    getSql: (context: any) => string;
};
export { booleanOperator };
