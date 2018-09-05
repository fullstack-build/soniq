export declare class Email {
    private isReady;
    private transport;
    private readonly queueName;
    private config;
    private CONFIG;
    private logger;
    private eventEmitter;
    private readonly queueFactory;
    constructor(loggerFactory: any, queueFactory: any, config: any, schemaBuilder: any, bootLoader: any);
    private boot();
    sendMessage(to: string, subject: string, html: string, attachments?: undefined[], from?: string, jobOptions?: any): Promise<any>;
    private _sendMail(job);
    private createTransport(credentials);
}
