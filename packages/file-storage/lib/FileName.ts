
export class FileName {
  public name: string;
  public id: string;
  public type: string;
  public extension: string;
  public prefix: string;
  public uploadName: string;

  constructor(input: string | any) {
    if (typeof input === 'string') {
      const splitNameAndExtension = input.split('.');
      if (splitNameAndExtension.length < 2) {
        throw new Error('Invalid fileName. Missing extension.');
      }

      const fileNameFirstPartSplit = splitNameAndExtension.shift().split('-');
      const extension = splitNameAndExtension.join('.');

      if (fileNameFirstPartSplit.length !== 6) {
        throw new Error('Invalid fileName. Type or id missing.');
      }

      this.type = fileNameFirstPartSplit.pop();
      this.id = fileNameFirstPartSplit.join('-');
      this.extension = extension;
      this.name = input;
      this.generateHelpers();
    } else {
      if (input == null) {
        throw new Error('The first parameter of the constructor cannot be null');
      }
      if (typeof input !== 'object') {
        throw new Error('The first parameter of the constructor must be an object or a string');
      }
      if (input.id == null) {
        throw new Error('If you are passing an object it should include an id');
      }
      if (input.type == null) {
        throw new Error('If you are passing an object it should include a type');
      }
      if (input.extension == null) {
        throw new Error('If you are passing an object it should include an extension');
      }
      this.id = input.id;
      this.type = input.type;
      this.extension = input.extension;
      this.name = this.createFileName(this.id, this.type, this.extension);
      this.generateHelpers();
    }
  }

  private createFileName(id, type, extension) {
    return `${id}-${type}.${extension}`;
  }

  private generateHelpers() {
    this.createPrefix();
    this.createUploadName();
  }

  private createPrefix() {
    this.prefix = `${this.id}-${this.type}`;
  }

  private createUploadName() {
    this.uploadName = `${this.id}-${this.type}-upload.${this.extension}`;
  }

  public createTempName() {
    return `${this.id}-${this.type}-${Date.now()}_${Math.round(Math.random() * 100000000000)}-temp.${this.extension}`;
  }
}
