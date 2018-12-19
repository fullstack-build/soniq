export declare class BootLoader {
    private IS_BOOTING;
    private HAS_BOOTED;
    private bootFunctions;
    private bootReadyFunctions;
    private readonly logger;
    constructor(loggerFactory: any);
    isBooting(): boolean;
    hasBooted(): boolean;
    addBootFunction(name: string, fn: any): void;
    onBootReady(name: string, fn: any): any;
    getReadyPromise(): Promise<{}>;
    boot(): Promise<void>;
}
