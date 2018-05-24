import { IExpressions, IViews } from './interfaces';
declare const _default: (classification: any, views: IViews, expressions: IExpressions, dbObject: any, viewSchemaName: any, parsers: any) => {
    document: {
        kind: string;
        definitions: any;
    };
    dbViews: any[];
    gQlTypes: any;
    queries: any[];
    mutations: any[];
    customFields: {};
};
export default _default;
