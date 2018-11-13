export declare abstract class AHelper {
    static loadFilesByGlobPattern(pattern: string): Promise<any[]>;
    static requireFilesByGlobPattern(pattern: string): Promise<any[]>;
    static requireFilesByGlobPatternAsObject(pattern: string): Promise<{}>;
}
