// Directive Parser
export interface IDirectiveParser {
  [name: string]: (gQlDirectiveNode, dbMetaNode, refDbMeta, refDbMetaCurrentTable, refDbMetaCurrentTableColumn) => void;
}
