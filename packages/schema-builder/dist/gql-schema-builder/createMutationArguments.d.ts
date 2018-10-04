export declare function createMutationArguments(gqlInputTypeName: any): {
    kind: string;
    name: {
        kind: string;
        value: string;
    };
    type: {
        kind: string;
        type: {
            kind: string;
            name: {
                kind: string;
                value: any;
            };
        };
    };
    defaultValue: any;
    directives: any[];
}[];
