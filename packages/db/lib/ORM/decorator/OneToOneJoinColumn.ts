import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function OneToOneJoinColumn<T>(typeFunction: (type?: any) => new () => T, options?: typeorm.RelationOptions & { nullable?: boolean }) {
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    // Need to wait for the next tick so all entity classes are laoded and typeFunction is correctly intialized.
    process.nextTick(() => {
      const identifier = typeFunction();
      if (identifier == null || identifier.name == null) {
        throw Error(`OneToOneJoinColumn.identifier.is.no.constructor for ${entityName}.${columnName}`);
      }

      const foreignEntityName = identifier ? identifier.name : `Unknown${Math.floor(Math.random() * 100)}`;
      const relationName = entityName < foreignEntityName ? `${entityName}_${foreignEntityName}` : `${foreignEntityName}_${entityName}`;
      const directive = `@relation(name: "${relationName}")`;
      ModelMeta.createColumnMeta(entityName, columnName, { nullable: options ? options.nullable : false, gqlType: foreignEntityName }, [directive]);

      typeorm.JoinColumn()(target, columnName);
      typeorm.OneToOne(typeFunction, options)(target, columnName);
      ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
    });
  };
}
