import { ILogger } from "./ILogger";
export declare class Logger implements ILogger {
    private LEVELS;
    private loggerName;
    private readonly tracerLogger;
    private readonly debugLogger;
    private projectEnvString;
    constructor(moduleName: string, loggerConfig: any, env: any);
    /**
     *  PRIVATE METHODS
     */
    private logToDebug;
    /**
     * Empty functions for code completion
     * implementation is within tracer
     */
    trace(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}
