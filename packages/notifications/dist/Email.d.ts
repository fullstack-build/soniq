import * as ONE from 'fullstack-one';
export declare class Email extends ONE.AbstractPackage {
    private isReady;
    private transport;
    private CONFIG;
    private logger;
    private eventEmitter;
    private readonly queueFactory;
    constructor(loggerFactory?: any, queueFactory?: any);
    sendMessage(to: string, subject: string, html: string, attachments?: undefined[], from?: string): Promise<any>;
    private _sendMail(job);
    private createTransport(credentials);
}
