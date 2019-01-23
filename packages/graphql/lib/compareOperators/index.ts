import * as equal from "./equal";
import * as lessAndGreaterThan from "./lessAndGreaterThan";
import * as boolean from "./boolean";
import * as inOperators from "./in";
import * as pattern from "./pattern";
import { IOperatorObject } from "./types";

const operators: IOperatorObject = { ...equal, ...lessAndGreaterThan, ...boolean, ...inOperators, ...pattern };

const operatorsObject: IOperatorObject = {};

const operatorKeys = Object.values(operators).map((operator) => {
  if (operatorsObject[operator.name] != null) {
    throw new Error(`Operator '${operator.name}' has been defined twice!`);
  }
  operatorsObject[operator.name] = operator;
  return operator.name;
});

export { operators, operatorKeys, operatorsObject };
