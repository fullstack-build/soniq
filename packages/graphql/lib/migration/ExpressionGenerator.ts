import { ExpressionCompiler, ICompiledExpression, orderExpressions } from "./ExpressionCompiler";

export class ExpressionGenerator {
  private expressionCompiler: ExpressionCompiler;
  private requiredCompiledExpressions: ICompiledExpression[] = [];

  constructor(expressionCompiler: ExpressionCompiler) {
    this.expressionCompiler = expressionCompiler;
  }

  private addCompiledExpression(compiledExpression: ICompiledExpression) {
    for (const i in this.requiredCompiledExpressions) {
      if (this.requiredCompiledExpressions[i].id === compiledExpression.id) {
        // Already added
        return;
      }
    }

    this.requiredCompiledExpressions.push(compiledExpression);

    compiledExpression.requiredExpressionIds.forEach((expressionId) => {
      this.addCompiledExpression(this.expressionCompiler.compileExpression(expressionId));
    });
  }

  public getCompiledExpressionById(id: string, directRequired: boolean = true, addToRequiredList: boolean = true) {
    const compiledExpression = this.expressionCompiler.compileExpression(id);

    compiledExpression.directRequired = directRequired;

    if (addToRequiredList === true) {
      this.addCompiledExpression(compiledExpression);
    }

    return compiledExpression;
  }

  public getRequiredCompiledExpressions() {
    return this.requiredCompiledExpressions.sort(orderExpressions);
  }
}
