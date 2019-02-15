import { InputObjectTypeDefinitionNode, InputValueDefinitionNode, TypeNode } from "graphql";
import { IOperatorObject, IOperator, isSingleValueOperator } from "../types";

export default function getOperatorsDefinition(operatorsObject: IOperatorObject): InputObjectTypeDefinitionNode {
  return {
    kind: "InputObjectTypeDefinition",
    name: {
      kind: "Name",
      value: "Operators"
    },
    directives: [],
    fields: Object.values(operatorsObject).map(getInputValueDefinitionNode)
  };
}

function getInputValueDefinitionNode(operator: IOperator): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: operator.name
    },
    type: getTypeNode(operator),
    defaultValue: null,
    directives: []
  };
}

function getTypeNode(operator: IOperator): TypeNode {
  if (isSingleValueOperator(operator)) {
    return {
      kind: "NamedType",
      name: {
        kind: "Name",
        value: operator.value
      }
    };
  }
  return {
    kind: "ListType",
    type: {
      kind: "NonNullType",
      type: {
        kind: "NamedType",
        name: {
          kind: "Name",
          value: "String"
        }
      }
    }
  };
}
