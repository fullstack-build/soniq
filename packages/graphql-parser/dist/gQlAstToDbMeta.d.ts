import { IDbMeta } from '@fullstack-one/db';
export declare const registerDirectiveParser: (nameInLowerCase: string, fn: (gQlDirectiveNode: any, dbMetaNode: any, refDbMeta: any, refDbMetaCurrentTable: any, refDbMetaCurrentTableColumn: any) => void) => void;
export declare const parseGQlAstToDbMeta: (graphQlJsonSchema: any) => IDbMeta;
