/// <reference types="node" />
import * as http from 'http';
export declare class Server {
    private serverConfig;
    private server;
    private app;
    private config;
    private loggerFactory;
    private logger;
    private ENVIRONMENT;
    constructor(loggerFactory: any, config: any, bootLoader: any);
    private boot;
    getApp(): any;
    getServer(): http.Server;
    private bootKoa;
    private emit;
    private on;
}
