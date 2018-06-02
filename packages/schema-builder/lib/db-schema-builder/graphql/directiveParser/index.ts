import { IDirectiveParser } from './IDirectiveParser';

// object with all directive parser
const directiveParser: IDirectiveParser = {};
// register directive parser
export function registerDirectiveParser(nameInLowerCase: string, fn: (gQlDirectiveNode,
                                                                      dbMetaNode,
                                                                      refDbMeta,
                                                                      refDbMetaCurrentTable,
                                                                      refDbMetaCurrentTableColumn) => void): void {
  directiveParser[nameInLowerCase] = fn;
}

// return currently registered parser
export function getDirectiveParser(directiveName?: string): IDirectiveParser | any {
  return (directiveName != null) ? directiveParser[directiveName] : directiveParser;
}
