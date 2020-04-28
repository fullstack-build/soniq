import * as equal from "./equal";
import * as lessAndGreaterThan from "./lessAndGreaterThan";
import * as boolean from "./boolean";
import * as inOperators from "./in";
import * as pattern from "./pattern";
import { IOperatorsByName } from "./types";

export * from "./types";

export class OperatorsBuilder {
  private operatorsByName: IOperatorsByName = {};

  constructor() {
    this.addOperators(equal);
    this.addOperators(lessAndGreaterThan);
    this.addOperators(boolean);
    this.addOperators(inOperators);
    this.addOperators(pattern);
  }

  public addOperators(operatorsByName: IOperatorsByName) {
    Object.keys(operatorsByName).forEach((key) => {
      if (operatorsByName[key].name !== key) {
        throw new Error(`The operator with name '${operatorsByName[key].name}' does not match its key '${key}'.`);
      }
      if (this.operatorsByName[key] != null) {
        throw new Error(`Operators have been defined twice or more: '${key}'`);
      }
      this.operatorsByName[key] = operatorsByName[key];
    });
  }

  public buildTypeDefs(): string {
    let typeDefs = "";
    const operatorsInputTypeFields: string[] = [];

    Object.values(this.operatorsByName).forEach((operator) => {
      operatorsInputTypeFields.push(`${operator.name}: ${operator.gqlInputType}`);

      if (operator.typeDefs != null) {
        typeDefs += `${operator.typeDefs}\n`;
      }
    });

    const operatorsTypeDef = `input Operators {\n${operatorsInputTypeFields}}\n`;

    return `${operatorsTypeDef}\n${typeDefs}\n`;
  }

  public getOperatorByName(name: string) {
    return this.operatorsByName[name];
  }
}
