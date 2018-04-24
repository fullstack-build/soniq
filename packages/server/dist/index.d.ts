/// <reference types="node" />
import * as http from 'http';
export declare class Server {
    private serverConfig;
    private server;
    private app;
    private ENVIRONMENT;
    private logger;
    constructor(loggerFactory?: any, config?: any, bootLoader?: any);
    getApp(): any;
    getServer(): http.Server;
    private boot();
    private emit(eventName, ...args);
    private on(eventName, listener);
}
