export declare class FbHelper {
    private config;
    private axios;
    private logger;
    constructor(config: any, logger: any);
    private debugToken;
    getProfile(token: any): Promise<any>;
}
