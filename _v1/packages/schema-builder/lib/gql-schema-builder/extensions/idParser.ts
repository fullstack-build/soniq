import { FieldDefinitionNode } from "graphql";
import { Mutable } from "../interfaces";
import { IParser, IParseUpdateFieldContext, IParseCreateFieldContext } from "./interfaces";

const idParser: IParser = {
  parseUpdateField,
  parseCreateField
};

export default idParser;

function parseUpdateField(ctx: IParseUpdateFieldContext) {
  const { gqlFieldDefinition, view, fieldName } = ctx;

  if (fieldName === "id" && view.fields.indexOf(fieldName) >= 0) {
    if (gqlFieldDefinition.type.kind !== "NonNullType") {
      (gqlFieldDefinition as Mutable<FieldDefinitionNode>).type = {
        kind: "NonNullType",
        type: gqlFieldDefinition.type
      };
    }
    return [gqlFieldDefinition];
  }
  return null;
}

function parseCreateField(ctx: IParseCreateFieldContext) {
  const { gqlFieldDefinition, view, fieldName } = ctx;

  if (fieldName === "id" && view.fields.indexOf(fieldName) >= 0) {
    if (gqlFieldDefinition.type.kind === "NonNullType") {
      (gqlFieldDefinition as Mutable<FieldDefinitionNode>).type = gqlFieldDefinition.type.type;
    }
    return [gqlFieldDefinition];
  }
  return null;
}
