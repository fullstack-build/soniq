declare const inOperator: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const notInOperator: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const includes: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const includesNot: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const contains: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
declare const isContainedBy: {
    name: string;
    value: string;
    getSql: (context: any) => string;
};
export { inOperator, notInOperator, includes, includesNot, contains, isContainedBy };
