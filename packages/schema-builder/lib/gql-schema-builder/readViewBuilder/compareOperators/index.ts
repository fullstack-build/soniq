import * as equal from "./equal";
import * as lessAndGreaterThan from "./lessAndGreaterThan";
import * as boolean from "./boolean";
import * as inOperators from "./in";
import * as pattern from "./pattern";
import { IOperatorsByName, IOperator, IOperatorsByKey } from "../../interfaces";

const operators: IOperatorsByKey = { ...equal, ...lessAndGreaterThan, ...boolean, ...inOperators, ...pattern };

const operatorsObject: IOperatorsByName = {};

const operatorKeys = Object.values(operators).map((operator: IOperator): string => {
  if (operatorsObject[operator.name] != null) {
    throw new Error(`Operator '${operator.name}' has been defined twice!`);
  }
  operatorsObject[operator.name] = operator;
  return operator.name;
});

export { operators, operatorKeys, operatorsObject };
