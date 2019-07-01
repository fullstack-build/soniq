import { Client } from "minio";
import { FileName } from "./FileName";
import { verify } from "crypto";

export interface IBucketObject {
  objectName: string;
  info: string;
}

export interface IPutObjectCacheSettings {
  expiryInSeconds: number;
}

export interface IGetObjectCacheSettings {
  expiryInSeconds: number;
  signIssueTimeReductionModuloInSeconds: number;
  cacheControlHeader: string | null;
  expiryHeader: string | null;
}

export abstract class AVerifier implements IVerifier {
  public client: Client;
  public bucket: string;

  constructor(client: Client, bucket: string) {
    this.client = client;
    this.bucket = bucket;
  }
  public async verify(verifyFileName: string, fileName: FileName): Promise<void> {
    // tslint:disable-next-line:quotemark
    throw new Error(`Please implement the 'verify(verifyFileName: string, fName: FileName)' method when extending class AVerifier.`);
  }

  public getObjectNames(fileName: FileName): IBucketObject[] {
    // tslint:disable-next-line:quotemark
    throw new Error(`Please implement the 'getObjectNames(fName: FileName)' method when extending class AVerifier.`);
  }

  public putObjectCacheSettings(fileName?: FileName): IPutObjectCacheSettings {
    return {
      expiryInSeconds: 43200 // 12 hours
    };
  }

  public getObjectCacheSettings(fileName?: FileName): IGetObjectCacheSettings {
    return {
      expiryInSeconds: 43200, // 12 hours
      signIssueTimeReductionModuloInSeconds: 3600, // one hour
      cacheControlHeader: "private, max-age=43200", // 12 hours
      expiryHeader: null
    };
  }
}

export interface IVerifier {
  verify: (verifyFileName: string, fileName: FileName) => Promise<void>;
  getObjectNames: (fileName: FileName) => IBucketObject[];
  putObjectCacheSettings: (fileName?: FileName) => IPutObjectCacheSettings;
  getObjectCacheSettings: (fileName?: FileName) => IGetObjectCacheSettings;
}
