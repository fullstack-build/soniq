export interface IDirectiveParser {
    [name: string]: (gQlDirectiveNode: any, dbMetaNode: any, refDbMeta: any, refDbMetaCurrentTable: any, refDbMetaCurrentTableColumn: any) => void;
}
