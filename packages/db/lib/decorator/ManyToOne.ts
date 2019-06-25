import * as typeorm from "typeorm";
import * as ModelMeta from "../model-meta";

// tslint:disable-next-line:function-name
export default function ManyToOne<T>(typeFunction: (type?: any) => new () => T, inverseSide: keyof T, options?: typeorm.RelationOptions) {
  return (target: object, columnName: string): void => {
    const entityName = target.constructor.name;
    // Need to wait for the next tick so all entity classes are laoded and typeFunction is correctly intialized.
    process.nextTick(() => {
      const identifier = typeFunction();
      if (identifier == null || identifier.name == null) {
        throw Error(`ManyToOne.identifier.is.no.constructor for ${entityName}.${columnName}`);
      }

      const foreignEntityName = identifier ? identifier.name : `Unknown${Math.floor(Math.random() * 100)}`;
      const relationName = entityName < foreignEntityName ? `${entityName}_${foreignEntityName}` : `${foreignEntityName}_${entityName}`;
      const directive = `@relation(name: "${columnName}_${relationName}")`;
      ModelMeta.createColumnMeta(entityName, columnName, { gqlType: foreignEntityName }, [directive]);

      if (inverseSide == null) typeorm.ManyToOne(typeFunction, (object: T) => object[inverseSide], options)(target, columnName);
      else typeorm.ManyToOne(typeFunction, options)(target, columnName);
      ModelMeta.setColumnSynchronizedTrue(entityName, columnName);
    });
  };
}
