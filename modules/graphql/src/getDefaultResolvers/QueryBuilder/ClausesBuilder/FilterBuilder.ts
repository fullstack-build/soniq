import { INestedFilter, IFilterLeaf } from "../types";
import { OperatorsBuilder, IOperatorContext, IOperator } from "../../../logicalOperators";
import { UserInputError } from "../../../GraphqlErrors";

export class FilterBuilder {
  private _operatorsBuilder: OperatorsBuilder;
  private _getParam: (value: unknown) => string;
  private _getColumn: (columnName: string) => string;

  public constructor(
    operatorsBuilder: OperatorsBuilder,
    getParam: (value: unknown) => string,
    getColumn: (columnName: string) => string
  ) {
    this._operatorsBuilder = operatorsBuilder;
    this._getParam = getParam;
    this._getColumn = getColumn;
  }

  private _generateConjunktionFilter(filterList: INestedFilter[]): string {
    return filterList.map(this.generate).join(" AND ");
  }

  private _generateDisjunctionFilter(filterList: INestedFilter[]): string {
    return filterList.map(this.generate).join(" OR ");
  }

  private _generateOperatorsFilter(columnName: string, field: IFilterLeaf): string {
    return Object.entries(field)
      .map(([operatorName, value]) => this._generateOperatorFilter(operatorName, columnName, value))
      .join(" AND ");
  }

  private _generateOperatorFilter(operatorName: string, columnName: string, value: unknown): string {
    const operator: IOperator = this._operatorsBuilder.getOperatorByName(operatorName);
    if (operator == null) {
      throw new UserInputError(`Operator '${operatorName}' not found.`);
    }

    const context: IOperatorContext = {
      fieldPgSelector: this._getColumn(columnName),
      value,
      getParam: this._getParam.bind(this),
    };
    return operator.getSql(context);
  }

  public generate(filter: INestedFilter): string {
    const sqlList: string[] = [];

    Object.entries(filter).forEach(([fieldName, field]) => {
      if (fieldName === "AND") {
        sqlList.push(`(${this._generateConjunktionFilter(field as INestedFilter[])})`);
      } else if (fieldName === "OR") {
        sqlList.push(`(${this._generateDisjunctionFilter(field as INestedFilter[])})`);
      } else {
        sqlList.push(`(${this._generateOperatorsFilter(fieldName, field as IFilterLeaf)})`);
      }
    });

    return sqlList.join(" AND ");
  }
}
