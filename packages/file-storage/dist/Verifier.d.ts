import { Client } from "minio";
import { FileName } from "./FileName";
export interface IBucketObject {
    objectName: string;
    info: string;
}
export declare class Verifier {
    client: Client;
    bucket: string;
    constructor(client: Client, bucket: string);
    verify(verifyFileName: string, fName: FileName): Promise<void>;
    getObjectNames(fName: FileName): IBucketObject[];
}
