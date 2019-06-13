import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// TODO: build a createEntityDecorator function
// tslint:disable-next-line:function-name
export default function Entity() {
  return (target: any) => {
    // <TFunction extends () => void>(target: TFunction): TFunction | void => {
    const entityName = target.name;
    const typeormDecorator = typeorm.Entity({ name: entityName });
    ModelMeta.addEntityMeta(entityName);
    return typeormDecorator(target);
  };
  // return <TFunction extends () => void>(target: TFunction): TFunction | void => {
  //   ModelMeta.enhanceEntityMeta(name, { isTypeormEntity: true, decoratorTarget: target });
  //   return typeorm.Entity({ name })(target);
  // };
}
