export declare class NotificationsEmail {
    private isReady;
    private transport;
    private readonly queueName;
    private readonly mailGenerator;
    private readonly config;
    private readonly CONFIG;
    private readonly logger;
    private readonly queueFactory;
    private readonly eventEmitter;
    constructor(loggerFactory: any, queueFactory: any, config: any, schemaBuilder: any, bootLoader: any);
    private boot;
    private _sendMail;
    private createTransport;
    sendMessage(to: string, subject: string, html: string, text?: string, attachments?: undefined[], from?: string, jobOptions?: any): Promise<any>;
    sendTemplateMail(to: string, subject: string, template: any, text?: string, attachments?: undefined[], from?: string, jobOptions?: any): Promise<any>;
}
