export class RevertibleResult {
  private _result: unknown;
  private _rollbackFunction: () => Promise<void>;
  private _onCommited: (() => Promise<void>) | null;

  public constructor(
    result: unknown,
    rollbackFunction: () => Promise<void>,
    onCommited: (() => Promise<void>) | null = null
  ) {
    this._result = result;
    this._rollbackFunction = rollbackFunction;
    this._onCommited = onCommited;
  }

  public getResult(): unknown {
    return this._result;
  }

  public getRollbackFunction(): () => Promise<void> {
    return this._rollbackFunction;
  }

  public getOnCommitedHandler(): (() => Promise<void>) | null {
    return this._onCommited;
  }
}
