export interface IUploadFile {
  extension: string;
  type: string;
  fileName: string;
  uploadFileName: string;
  presignedPutUrl: string;
}

export interface IBucketFile {
  fileName: string;
  objects: IBucketObject[];
}

export interface IBucketObject {
  objectName: string;
  presignedGetUrl: string;
  info: string;
}
