import * as equal from "./equal";
import * as lessAndGreaterThan from "./lessAndGreaterThan";
import * as boolean from "./boolean";
import * as inOperators from "./in";
import * as pattern from "./pattern";

const operators = { ...equal, ...lessAndGreaterThan, ...boolean, ...inOperators, ...pattern };

const operatorsObject: any = {};

const operatorKeys = Object.values(operators).map((operator: any) => {
  if (operatorsObject[operator.name] != null) {
    throw new Error(`Operator '${operator.name}' has been defined twice!`);
  }
  operatorsObject[operator.name] = operator;
  return operator.name;
});

export { operators, operatorKeys, operatorsObject };
