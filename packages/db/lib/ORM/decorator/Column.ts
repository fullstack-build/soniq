import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function Column(columnOptions: ModelMeta.TColumnOptions) {
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    ModelMeta.addColumnOptions(entityName, columnName, columnOptions);

    const typeormDecorator = typeorm.Column(ModelMeta.getColumnOptions(entityName, columnName));
    typeormDecorator(target, columnName);
    ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
  };
}
