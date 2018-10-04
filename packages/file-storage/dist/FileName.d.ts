export declare class FileName {
  name: string;
  id: string;
  type: string;
  extension: string;
  prefix: string;
  uploadName: string;
  constructor(input: string | any);
  private createFileName;
  private generateHelpers;
  private createPrefix;
  private createUploadName;
  createTempName(): string;
}
