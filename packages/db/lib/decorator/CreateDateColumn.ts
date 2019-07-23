import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function CreateDateColumn(options?: typeorm.ColumnOptions) {
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    ModelMeta.addColumnOptions(entityName, columnName, {
      ...options,
      type: "timestamp with time zone",
      default: () => "now()",
      gqlType: "String",
      nullable: false
    });

    const finalColumnOptions = ModelMeta.getFinalColumnOptions(entityName, columnName);
    const typeormDecorator = typeorm.Column(finalColumnOptions);
    typeormDecorator(target, columnName);
    ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
  };
}
