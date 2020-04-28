import { INestedFilter, IFilterLeaf } from "../types";
import { OperatorsBuilder, IOperatorContext } from "../../../logicalOperators";
import { UserInputError } from "../../../GraphqlErrors";

export class FilterBuilder {
  private operatorsBuilder: OperatorsBuilder;
  private getParam: (value: any) => string;
  private getColumn: (columnName: string) => string;

  constructor(operatorsBuilder: OperatorsBuilder, getParam: (value: any) => string, getColumn: (columnName: string) => string) {
    this.operatorsBuilder = operatorsBuilder;
    this.getParam = getParam;
    this.getColumn = getColumn;
  }

  private generateConjunktionFilter(filterList: INestedFilter[]) {
    return filterList.map(this.generate).join(" AND ");
  }

  private generateDisjunctionFilter(filterList: INestedFilter[]) {
    return filterList.map(this.generate).join(" OR ");
  }

  private generateOperatorsFilter(columnName: string, field: IFilterLeaf) {
    return Object.entries(field)
      .map(([operatorName, value]) => this.generateOperatorFilter(operatorName, columnName, value))
      .join(" AND ");
  }

  private generateOperatorFilter(operatorName: string, columnName: string, value: any) {
    const operator = this.operatorsBuilder.getOperatorByName(operatorName);
    if (operator == null) {
      throw new UserInputError(`Operator '${operatorName}' not found.`, { exposeDetails: true });
    }

    const context: IOperatorContext = {
      fieldPgSelector: this.getColumn(columnName),
      value,
      getParam: this.getParam.bind(this)
    };
    return operator.getSql(context);
  }

  public generate(filter: INestedFilter): string {
    const sqlList: string[] = [];

    Object.entries(filter).forEach(([fieldName, field]) => {
      if (fieldName === "AND") {
        sqlList.push(`(${this.generateConjunktionFilter(field as INestedFilter[])})`);
      } else if (fieldName === "OR") {
        sqlList.push(`(${this.generateDisjunctionFilter(field as INestedFilter[])})`);
      } else {
        sqlList.push(`(${this.generateOperatorsFilter(fieldName, field as IFilterLeaf)})`);
      }
    });

    return sqlList.join(" AND ");
  }
}
