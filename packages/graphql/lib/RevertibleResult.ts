export class RevertibleResult {
  private result: any;
  private rollbackFunction: () => void;

  constructor(result: any, rollbackFunction: () => void) {
    this.result = result;
    this.rollbackFunction = rollbackFunction;
  }

  public getResult() {
    return this.result;
  }

  public getRollbackFunction() {
    return this.rollbackFunction;
  }
}
