import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function UpdateDateColumn(options?: typeorm.ColumnOptions) {
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    ModelMeta.addEntityTrigger(entityName, {
      name: `table_trigger_updatedat_${columnName}`,
      when: "BEFORE",
      operations: ["UPDATE"],
      functionName: "_meta.triggerupdateorcreate",
      functionArguments: [columnName]
    });
    ModelMeta.addColumnOptions(entityName, columnName, {
      ...options,
      type: "timestamp with time zone",
      default: () => "now()",
      gqlType: "String",
      nullable: false
    });
    ModelMeta.addColumnExtension(entityName, columnName, ["updatedat", true]);

    const finalColumnOptions = ModelMeta.getFinalColumnOptions(entityName, columnName);
    const typeormDecorator = typeorm.Column(finalColumnOptions);
    typeormDecorator(target, columnName);
    ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
  };
}
