export declare class BootLoader {
    private bootFunctions;
    private bootReadyFunctions;
    private hasBooted;
    addBootFunction(fn: any): void;
    getReadyPromise(): Promise<{}>;
    boot(): Promise<void>;
}
