import { IDirectiveParser } from './IDirectiveParser';
export declare function registerDirectiveParser(directiveNameInLowerCase: string, fn: (gQlDirectiveNode: any, dbMetaNode: any, refDbMeta: any, refDbMetaCurrentTable: any, refDbMetaCurrentTableColumn: any) => void): void;
export declare function getDirectiveParser(directiveName?: string): IDirectiveParser | any;
