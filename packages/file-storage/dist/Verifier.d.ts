import { Client } from "minio";
import { FileName } from "./FileName";
export interface IBucketObject {
    objectName: string;
    info: string;
}
export interface IPutObjectCacheSettings {
    expiryInSeconds: any;
}
export interface IGetObjectCacheSettings {
    expiryInSeconds: number;
    signIssueTimeReductionModuloInSeconds: number;
    cacheControlHeader: string | null;
    expiryHeader: string | null;
}
export declare class Verifier {
    client: Client;
    bucket: string;
    constructor(client: Client, bucket: string);
    verify(verifyFileName: string, fName: FileName): Promise<void>;
    getObjectNames(fName: FileName): IBucketObject[];
    putObjectCacheSettings(fName: FileName): IPutObjectCacheSettings;
    getObjectCacheSettings(fName: FileName): IGetObjectCacheSettings;
}
