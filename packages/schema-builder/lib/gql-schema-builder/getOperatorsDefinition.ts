import { NamedTypeNode, ListTypeNode, InputValueDefinitionNode } from "graphql";
import { IOperator } from "./interfaces";

function operationValueMapper(value: string): NamedTypeNode | ListTypeNode {
  if (value[0] !== "[") {
    return {
      kind: "NamedType",
      name: {
        kind: "Name",
        value
      }
    };
  } else {
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
}

function getOperationField(operation: IOperator): InputValueDefinitionNode {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: operation.name
    },
    type: operationValueMapper(operation.value),
    defaultValue: null,
    directives: []
  }
}
