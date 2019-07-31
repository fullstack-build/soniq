import * as ModelMeta from "../model-meta";
import { GqlScalarFieldType } from "../model-meta/types";

// tslint:disable-next-line:function-name
export default function Field(gqlType: GqlScalarFieldType | string) {
  return (target: object, fieldName: string): void => {
    const typeName = target.constructor.name;
    ModelMeta.addField(typeName, fieldName, gqlType);
  };
}
