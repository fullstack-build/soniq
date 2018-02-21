/// <reference types="node" />
import * as http from 'http';
export declare class Server {
    private server;
    private app;
    private ENVIRONMENT;
    private logger;
    private eventEmitter;
    constructor(eventEmitter?: any, loggerFactory?: any, bootLoader?: any);
    getApp(): any;
    getServer(): http.Server;
    private boot();
    private emit(eventName, ...args);
    private on(eventName, listener);
}
