export declare function sha256(input: any): any;
export declare function sha512(input: any): any;
export declare function createConfig(
  config: any
): {
  saltBytes: any;
  hashBytes: any;
  opslimit: any;
  memlimit: any;
  algorithm: any;
};
export declare function newHash(password: any, config: any): Promise<{}>;
export declare function hashByMeta(password: any, meta: any): Promise<{}>;
