/* eslint-disable @typescript-eslint/no-explicit-any */
export class ReturnIdHandler {
  private _context: any;
  private _returnIdKey: string | null = null;

  public constructor(context: any, returnIdKey: string | null) {
    if (context._returnIds == null) {
      context._returnIds = {};
    }

    this._context = context;
    this._returnIdKey = returnIdKey;
  }

  public setReturnId(value: any): boolean {
    if (this._returnIdKey != null) {
      this._context._returnIds[this._returnIdKey] = value;
      return true;
    }
    return false;
  }

  public getReturnId(returnIdKey: string): any {
    if (this._context._returnIds[returnIdKey] != null) {
      return this._context._returnIds[returnIdKey];
    }
    return returnIdKey;
  }
}
