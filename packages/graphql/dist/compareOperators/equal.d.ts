declare const equal: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const notEqual: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const isDistinctFrom: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const isNotDistinctFrom: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
export { equal, notEqual, isDistinctFrom, isNotDistinctFrom };
