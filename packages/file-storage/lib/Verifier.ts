
import { Client } from 'minio';
import { FileName } from './FileName';

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

  public async verify(verifyFileName: string, fName: FileName): Promise<void> {
    // tslint:disable-next-line:quotemark
    throw new Error(`Please implement the 'verify(verifyFileName: string, fName: FileName)' method when extending class Verifier.`);
  }

  // Returns a
  public getObjectNames(fName: FileName): IBucketObject[] {
    // tslint:disable-next-line:quotemark
    throw new Error(`Please implement the 'getObjectNames(fName: FileName)' method when extending class Verifier.`);
  }
}
