export declare class GracefulShutdown {
    private dbAppClient;
    private dbPoolObj;
    private ENVIRONMENT;
    private loggerFactory;
    private logger;
    private eventEmitter;
    constructor(eventEmitter: any, loggerFactory: any, bootLoader: any, dbAppClient: any, dbPoolObj: any, config: any);
    private boot;
    private disconnectDB;
    private emit;
    private on;
}
