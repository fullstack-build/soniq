import { IDirectiveParser } from './IDirectiveParser';
export declare function registerDirectiveParser(directiveNameInLowerCase: string, fn: (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => void): void;
export declare function getDirectiveParser(directiveName?: string): IDirectiveParser | any;
