
import { Client } from 'minio';

export interface IBucketObject {
  objectName: string;
  info: string;
}

export class Verifier {
  public client: Client;
  public bucket: string;

  constructor (client: Client, bucket: string) {
    this.client = client;
    this.bucket = bucket;
  }

  public async verify(verifyFileName: string, id: string, type: string, extension: string): Promise<void> {
    // tslint:disable-next-line:quotemark
    throw new Error(`Please implement the 'verify(verifyFileName, id, type, extension)' method when extending class Verifier.`);
  }

  // Returns a
  public getObjectNames(id: string, type: string, extension: string): IBucketObject[] {
    // tslint:disable-next-line:quotemark
    throw new Error(`Please implement the 'getObjectNames(id, type, extension)' method when extending class Verifier.`);
  }
}
