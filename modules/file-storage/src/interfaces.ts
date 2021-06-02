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

export interface IBucketObjectInternal {
  objectName: string;
  info: string;
}

export interface IBucketObjectWithUrl extends IBucketObjectInternal {
  presignedGetUrl: string;
}

export interface IBucketObjectWithPromise extends IBucketObjectInternal {
  presignedGetUrlPromise: Promise<string>;
}

export interface IBucketFileWithPromise {
  fileName: string;
  objects: IBucketObjectWithPromise[];
}
