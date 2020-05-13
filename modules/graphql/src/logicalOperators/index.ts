import * as equal from "./equal";
import * as lessAndGreaterThan from "./lessAndGreaterThan";
import * as boolean from "./boolean";
import * as inOperators from "./in";
import * as pattern from "./pattern";
import { IOperatorsByName, IOperator } from "./types";

export * from "./types";

export class OperatorsBuilder {
  private _operatorsByName: IOperatorsByName = {};

  public constructor() {
    this.addOperators(equal);
    this.addOperators(lessAndGreaterThan);
    this.addOperators(boolean);
    this.addOperators(inOperators);
    this.addOperators(pattern);
  }

  public addOperators(operatorsByName: IOperatorsByName): void {
    Object.keys(operatorsByName).forEach((key) => {
      if (operatorsByName[key].name !== key) {
        throw new Error(`The operator with name '${operatorsByName[key].name}' does not match its key '${key}'.`);
      }
      if (this._operatorsByName[key] != null) {
        throw new Error(`Operators have been defined twice or more: '${key}'`);
      }
      this._operatorsByName[key] = operatorsByName[key];
    });
  }

  public buildTypeDefs(): string {
    let typeDefs: string = "";
    const operatorsInputTypeFields: string[] = [];

    Object.values(this._operatorsByName).forEach((operator) => {
      operatorsInputTypeFields.push(`${operator.name}: ${operator.gqlInputType}`);

      if (operator.typeDefs != null) {
        typeDefs += `${operator.typeDefs}\n`;
      }
    });

    const operatorsTypeDef: string = `input Operators {\n${operatorsInputTypeFields}}\n`;

    return `${operatorsTypeDef}\n${typeDefs}\n`;
  }

  public getOperatorByName(name: string): IOperator {
    return this._operatorsByName[name];
  }
}
