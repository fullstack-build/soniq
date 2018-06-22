export declare function getQueryArguments(gqlTypeName: any): ({
    kind: string;
    name: {
        kind: string;
        value: string;
    };
    type: {
        kind: string;
        name: {
            kind: string;
            value: string;
        };
    };
    defaultValue: any;
    directives: any[];
} | {
    kind: string;
    name: {
        kind: string;
        value: string;
    };
    type: {
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
    };
    defaultValue: any;
    directives: any[];
})[];
