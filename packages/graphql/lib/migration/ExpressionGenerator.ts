import { ExpressionCompiler, ICompiledExpression, orderExpressions } from "./ExpressionCompiler";

export class ExpressionGenerator {
  private expressionCompiler: ExpressionCompiler;
  private requiredCompiledExpressions: ICompiledExpression[] = [];

  constructor(expressionCompiler: ExpressionCompiler) {
    this.expressionCompiler = expressionCompiler;
  }

  private addCompiledExpression(compiledExpression: ICompiledExpression) {
    for (const i in this.requiredCompiledExpressions) {
      if (this.requiredCompiledExpressions[i].name === compiledExpression.name) {
        // Already added
        return;
      }
    }

    this.requiredCompiledExpressions.push(compiledExpression);

    compiledExpression.requiredCompiledExpressionNames.forEach((compiledExpressionName) => {
      this.addCompiledExpression(this.expressionCompiler.getCompiledExpressionByName(compiledExpressionName));
    });
  }

  public getCompiledExpressionById(id: string, directRequired: boolean = true, addToRequiredList: boolean = true) {
    const compiledExpression = this.expressionCompiler.getCompiledExpressionById(id);

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
