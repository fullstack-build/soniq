export declare namespace helper {
    const loadFilesByGlobPattern: (pattern: string) => Promise<any[]>;
    const requireFilesByGlobPattern: (pattern: string) => Promise<any[]>;
    const requireFilesByGlobPatternAsObject: (pattern: string) => Promise<{}>;
}
