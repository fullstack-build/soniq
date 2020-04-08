import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function Type() {
  return (target: any) => {
    const typeName = target.name;
    ModelMeta.addType(typeName);

    return target;
  };
}
