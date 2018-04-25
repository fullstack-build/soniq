export declare function getAdminSignature(adminSecret: any): string;
export declare function getProviderSignature(adminSecret: any, provider: any, userIdentifier: any): any;
export declare function signJwt(jwtSecret: any, payload: any, expiresIn: any): any;
export declare function verifyJwt(jwtSecret: any, token: any): any;
