export interface IInput {
  id: string;
  type: string;
  extension: string;
}

export class FileName {
  public name: string;
  public id: string;
  public type: string;
  public extension: string;
  public prefix: string;
  public uploadName: string;

  public constructor(input: string | IInput) {
    if (typeof input === "string") {
      const splitNameAndExtension: string[] = input.split(".");
      if (splitNameAndExtension.length < 2) {
        throw new Error("Invalid fileName. Missing extension.");
      }

      const lastElement: string | undefined = splitNameAndExtension.shift();

      if (lastElement == null) {
        throw new Error("Invalid fileName. Missing extension.");
      }

      const fileNameFirstPartSplit: string[] = lastElement.split("-");
      const extension: string = splitNameAndExtension.join(".");

      if (fileNameFirstPartSplit.length !== 6) {
        throw new Error("Invalid fileName. Type or id missing.");
      }

      this.type = fileNameFirstPartSplit.pop() as string;
      this.id = fileNameFirstPartSplit.join("-");
      this.extension = extension;
      this.name = input;
    } else {
      if (input == null) {
        throw new Error("The first parameter of the constructor cannot be null");
      }
      if (typeof input !== "object") {
        throw new Error("The first parameter of the constructor must be an object or a string");
      }
      if (input.id == null) {
        throw new Error("If you are passing an object it should include an id");
      }
      if (input.type == null) {
        throw new Error("If you are passing an object it should include a type");
      }
      if (input.extension == null) {
        throw new Error("If you are passing an object it should include an extension");
      }
      this.id = input.id;
      this.type = input.type;
      this.extension = input.extension;
      this.name = this._createFileName(this.id, this.type, this.extension);
    }
    this.prefix = `${this.id}-${this.type}`;
    this.uploadName = `${this.id}-${this.type}-upload.${this.extension}`;
  }

  public createTempName(): string {
    return `${this.id}-${this.type}-${Date.now()}_${Math.round(Math.random() * 100000000000)}-temp.${this.extension}`;
  }

  private _createFileName(id: string, type: string, extension: string): string {
    return `${id}-${type}.${extension}`;
  }
}
