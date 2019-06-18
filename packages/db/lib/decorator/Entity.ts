import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function Entity(options?: ModelMeta.TEntityOptions) {
  return (target: any) => {
    const entityName = target.name;
    ModelMeta.addEntityOptions(entityName, { name: entityName, ...options });
    const finalEntityOptions = ModelMeta.getFinalEntityOptions(entityName);
    const tableDirective = finalEntityOptions.schema != null ? `@table(schemaName: "${finalEntityOptions.schema}")` : `@table`;
    ModelMeta.addEntityDirective(entityName, tableDirective);
    ModelMeta.setEntitySynchronizedTrue(entityName);

    const typeormDecorator = typeorm.Entity(finalEntityOptions);
    return typeormDecorator(target);
  };
}
