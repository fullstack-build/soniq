import * as Minio from "minio";
import { FileName } from "./FileName";
import { AVerifier } from "./Verifier";

export class DefaultVerifier extends AVerifier {
  public async verify(verifyFileName: string, fileName: FileName) {
    try {
      const stat = await this.client.statObject(this.bucket, verifyFileName);

      const copyConditions = new Minio.CopyConditions();
      copyConditions.setMatchETag(stat.etag);

      await this.client.copyObject(this.bucket, fileName.name, `/${this.bucket}/${verifyFileName}`, copyConditions);
    } catch (e) {
      if (e.message.toLowerCase().indexOf("not found") >= 0) {
        throw new Error("Please upload a file before verifying.");
      }
      throw e;
    }
  }

  public getObjectNames(fileName: FileName) {
    return [
      {
        objectName: fileName.name,
        info: "default"
      }
    ];
  }
}
