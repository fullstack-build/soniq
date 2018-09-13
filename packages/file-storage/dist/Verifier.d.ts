import { Client } from 'minio';
export interface IBucketObject {
    objectName: string;
    info: string;
}
export declare class Verifier {
    client: Client;
    bucket: string;
    constructor(client: Client, bucket: string);
    verify(verifyFileName: string, id: string, type: string, extension: string): Promise<void>;
    getObjectNames(id: string, type: string, extension: string): IBucketObject[];
}
