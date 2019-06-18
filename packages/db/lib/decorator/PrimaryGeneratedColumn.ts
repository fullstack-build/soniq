import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function PrimaryGeneratedColumn(options?: { comment?: string }) {
  return (target: object, columnName: string) => {
    const entityName = target.constructor.name;
    const primaryGeneratedColumnOptions: ModelMeta.TColumnOptions = {
      type: "uuid",
      primary: true,
      unique: true,
      nullable: false,
      gqlType: "ID"
    };
    ModelMeta.addColumnOptions(entityName, columnName, {
      ...options,
      ...primaryGeneratedColumnOptions
    });

    const typeormDecorator = typeorm.Column({
      ...ModelMeta.getFinalColumnOptions(entityName, columnName),
      default: () => "_meta.uuid_generate_v4()"
    });
    // console.log(
    //   `${entityName}.${columnName}: ${JSON.stringify(
    //     ModelMeta.getFinalColumnOptions(entityName, columnName)
    //   )}`
    // );
    typeormDecorator(target, columnName);
    ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
  };
}
