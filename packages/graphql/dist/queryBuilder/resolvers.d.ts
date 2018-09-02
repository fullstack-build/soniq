export declare function sha1Base64(input: any): string;
export declare function getDefaultResolvers(resolverMeta: any, hooks: any, dbMeta: any, dbGeneralPool: any, logger: any, costLimit: any): {
    '@fullstack-one/graphql/queryResolver': (obj: any, args: any, context: any, info: any) => Promise<any>;
    '@fullstack-one/graphql/mutationResolver': (obj: any, args: any, context: any, info: any) => Promise<any>;
};
