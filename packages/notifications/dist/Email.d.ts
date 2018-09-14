export declare class Email {
    private isReady;
    private transport;
    private readonly queueName;
    private readonly config;
    private readonly CONFIG;
    private readonly logger;
    private readonly eventEmitter;
    private readonly queueFactory;
    constructor(loggerFactory: any, queueFactory: any, config: any, schemaBuilder: any, bootLoader: any);
    private boot;
    sendMessage(to: string, subject: string, html: string, attachments?: undefined[], from?: string, jobOptions?: any): Promise<any>;
    private _sendMail;
    private createTransport;
}
