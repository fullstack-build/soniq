export class RevertibleResult {
  private result: any;
  private rollbackFunction: () => Promise<void>;
  private onCommited: () => Promise<void> | null;

  constructor(result: any, rollbackFunction: () => Promise<void>, onCommited: () => Promise<void> = null) {
    this.result = result;
    this.rollbackFunction = rollbackFunction;
    this.onCommited = onCommited;
  }

  public getResult() {
    return this.result;
  }

  public getRollbackFunction() {
    return this.rollbackFunction;
  }

  public getOnCommitedHandler() {
    return this.onCommited;
  }
}
