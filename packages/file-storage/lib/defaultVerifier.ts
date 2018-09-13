
import * as Minio from 'minio';
import { Verifier } from './Verifier';

export class DefaultVerifier extends Verifier {
  public async verify(verifyFileName, id, type, extension) {
    try {
    const stat = await this.client.statObject(this.bucket, verifyFileName);

    const copyConditions = new Minio.CopyConditions();
    copyConditions.setMatchETag(stat.etag);

    const fileName = `${id}_${type}.${extension}`;

    await this.client.copyObject(this.bucket, fileName, `/${this.bucket}/${verifyFileName}`, copyConditions);
  } catch (e) {
    if (e.message.toLowerCase().indexOf('not found') >= 0) {
      throw new Error('Please upload a file before verifying.');
    }
    throw e;
  }
  }

  public getObjectNames(id, type, extension) {
    return [{
      objectName: `${id}_${type}.${extension}`,
      info: 'default'
    }];
  }
}
