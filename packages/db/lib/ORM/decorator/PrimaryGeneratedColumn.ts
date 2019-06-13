import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function PrimaryGeneratedColumn(options?: { comment?: string }) {
  return (target: object, columnName: string) => {
    const entityName = target.constructor.name;
    ModelMeta.createColumnMeta(entityName, columnName, { unique: true, nullable: false, gqlType: "ID" });
    const typeormDecorator = typeorm.PrimaryGeneratedColumn("uuid", options);
    typeormDecorator(target, columnName);
    ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
  };
}
