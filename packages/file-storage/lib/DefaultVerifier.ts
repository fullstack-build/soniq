import * as Minio from "minio";
import { Verifier } from "./Verifier";

export class DefaultVerifier extends Verifier {
  public async verify(verifyFileName, fName) {
    try {
      const stat = await this.client.statObject(this.bucket, verifyFileName);

      const copyConditions = new Minio.CopyConditions();
      copyConditions.setMatchETag(stat.etag);

      await this.client.copyObject(this.bucket, fName.name, `/${this.bucket}/${verifyFileName}`, copyConditions);
    } catch (e) {
      if (e.message.toLowerCase().indexOf("not found") >= 0) {
        throw new Error("Please upload a file before verifying.");
      }
      throw e;
    }
  }

  public getObjectNames(fName) {
    return [
      {
        objectName: fName.name,
        info: "default"
      }
    ];
  }
}
