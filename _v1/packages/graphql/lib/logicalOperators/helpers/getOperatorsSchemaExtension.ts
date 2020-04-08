import { IOperatorObject } from "../types";

export default function getOperatorsSchemaExtension(operatorsObject: IOperatorObject): string {
  return Object.values(operatorsObject)
    .map(({ schemaExtension }) => schemaExtension)
    .filter((schemaExtension) => schemaExtension != null)
    .join("\n");
}
