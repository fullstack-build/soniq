import { ExpressionCompiler, ICompiledExpression, orderExpressions } from "./ExpressionCompiler";

export class ExpressionGenerator {
  private _expressionCompiler: ExpressionCompiler;
  private _requiredCompiledExpressions: ICompiledExpression[] = [];

  public constructor(expressionCompiler: ExpressionCompiler) {
    this._expressionCompiler = expressionCompiler;
  }

  private _addCompiledExpression(compiledExpression: ICompiledExpression): void {
    for (const requiredCompiledExpression of this._requiredCompiledExpressions) {
      if (requiredCompiledExpression.id === compiledExpression.id) {
        // Already added
        return;
      }
    }

    this._requiredCompiledExpressions.push(compiledExpression);

    compiledExpression.requiredExpressionIds.forEach((expressionId: string) => {
      this._addCompiledExpression(this._expressionCompiler.compileExpression(expressionId));
    });
  }

  public getCompiledExpressionById(
    id: string,
    directRequired: boolean = true,
    addToRequiredList: boolean = true
  ): ICompiledExpression {
    const compiledExpression: ICompiledExpression = this._expressionCompiler.compileExpression(id);

    compiledExpression.directRequired = directRequired;

    if (addToRequiredList === true) {
      this._addCompiledExpression(compiledExpression);
    }

    return compiledExpression;
  }

  public getRequiredCompiledExpressions(): ICompiledExpression[] {
    return this._requiredCompiledExpressions.sort(orderExpressions);
  }
}
