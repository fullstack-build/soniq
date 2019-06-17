import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function Column(options?: ModelMeta.TColumnOptions) {
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    if (options != null) ModelMeta.addColumnOptions(entityName, columnName, options);

    const typeormDecorator = typeorm.Column(ModelMeta.getFinalColumnOptions(entityName, columnName));
    typeormDecorator(target, columnName);
    ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
  };
}
