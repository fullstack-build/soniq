export declare class GracefulShutdown {
    private dbAppClient;
    private dbPoolObj;
    private ENVIRONMENT;
    private logger;
    private eventEmitter;
    constructor(eventEmitter?: any, loggerFactory?: any, bootLoader?: any, dbAppClient?: any, dbPoolObj?: any, config?: any);
    private disconnectDB();
    private boot();
    private emit(eventName, ...args);
    private on(eventName, listener);
}
