export declare class FbHelper {
    private config;
    private axios;
    private logger;
    constructor(config: any, logger: any);
    getProfile(token: any): Promise<any>;
    private debugToken;
}
