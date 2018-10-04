export declare function createMutation(name: any, gqlTypeName: any, gqlInputTypeName: any, extendArguments: any): {
    kind: string;
    name: {
        kind: string;
        value: string;
    };
    interfaces: any[];
    directives: any[];
    fields: {
        kind: string;
        description: {
            kind: string;
            value: string;
            block: boolean;
        };
        name: {
            kind: string;
            value: any;
        };
        arguments: {
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
        directives: {
            kind: string;
            name: {
                kind: string;
                value: string;
            };
            arguments: {
                kind: string;
                name: {
                    kind: string;
                    value: string;
                };
                value: {
                    kind: string;
                    value: string;
                    block: boolean;
                };
            }[];
        }[];
    }[];
};
