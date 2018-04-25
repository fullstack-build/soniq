export declare class BootLoader {
    private bootFunctions;
    private bootReadyFunctions;
    private hasBooted;
    addBootFunction(fn: any): void;
    onBootReady(fn: any): any;
    getReadyPromise(): Promise<{}>;
    boot(): Promise<void>;
}
