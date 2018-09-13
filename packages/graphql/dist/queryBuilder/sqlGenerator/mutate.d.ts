export declare class MutationBuilder {
    private resolverMeta;
    constructor(resolverMeta: any);
    build(obj: any, args: any, context: any, info: any): {
        sql: string;
        values: any[];
        mutation: any;
        id: any;
    };
    private resolveCreateMutation(query, mutation);
    private resolveUpdateMutation(query, mutation);
    private resolveDeleteMutation(query, mutation);
}
