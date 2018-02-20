declare const _default: () => {
    kind: string;
    name: {
        kind: string;
        value: string;
    };
    directives: any[];
    fields: ({
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
            type?: undefined;
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
                name: {
                    kind: string;
                    value: string;
                };
            };
            name?: undefined;
        };
        defaultValue: any;
        directives: any[];
    })[];
};
export default _default;
