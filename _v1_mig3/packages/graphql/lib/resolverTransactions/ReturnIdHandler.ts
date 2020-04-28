export class ReturnIdHandler {
  private context: any;
  private returnIdKey: string | null = null;

  constructor(context: any, returnIdKey: string | null) {
    if (context._returnIds == null) {
      context._returnIds = {};
    }

    this.context = context;
    this.returnIdKey = returnIdKey;
  }

  public setReturnId(value: any): boolean {
    if (this.returnIdKey != null) {
      this.context._returnIds[this.returnIdKey] = value;
      return true;
    }
    return false;
  }

  public getReturnId(returnIdKey: string): any {
    if (this.context._returnIds[returnIdKey] != null) {
      return this.context._returnIds[returnIdKey];
    }
    return returnIdKey;
  }
}
