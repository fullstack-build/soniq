export declare class Email {
    private isReady;
    private transport;
    private CONFIG;
    private logger;
    private eventEmitter;
    private readonly queueFactory;
    constructor(loggerFactory?: any, queueFactory?: any, migration?: any);
    sendMessage(to: string, subject: string, html: string, attachments?: undefined[], from?: string): Promise<any>;
    private _sendMail(job);
    private createTransport(credentials);
}
