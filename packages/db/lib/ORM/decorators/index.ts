// tslint:disable:function-name
import "reflect-metadata";
import * as typeorm from "typeorm";
import * as ModelMeta from "./ModelMeta";

// TODO: build a createEntityDecorator function
export function Entity() {
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

export function Column() {
  return (target: object, columnName: string | symbol): void => {
    const entityName = target.constructor.name;
    ModelMeta.setColumnSynchronizedTrue(entityName, String(columnName));
    const columnOptions: typeorm.ColumnOptions = ModelMeta.getColumnOptions(entityName, String(columnName));
    const typeormDecorator = typeorm.Column(columnOptions);
    typeormDecorator(target, columnName);
  };
}

// TODO: It would be cool if this is created with createColumnDecoratorFactory
export function gqlFieldType(type: ModelMeta.GqlFieldType) {
  return (target: object, propertyName: string | symbol): void => {
    const entityName = target.constructor.name;
    ModelMeta.setColumnGqlType(entityName, String(propertyName), type);
  };
}

export function nullable(target: object, propertyName: string | symbol): void {
  const entityName = target.constructor.name;
  ModelMeta.setColumnNullableTrue(entityName, String(propertyName));
}

export const pgType = {
  uuid: createColumnDecorator({ columnOptions: { type: "uuid" } }),
  string: createColumnDecorator({ columnOptions: { type: "character varying" } }),
  integer: createColumnDecorator({ columnOptions: { type: "integer" } }),
  decimal: createColumnDecorator({ columnOptions: { type: "decimal" } }),
  json: createColumnDecorator({ columnOptions: { type: "json" } }),
  boolean: createColumnDecorator({ columnOptions: { type: "boolean" } })
};

type TStrategy = "increment" | "rowid" | "uuid";

// TODO: Get rid of this bitch? use createColumnDecoratorFactory
export function PrimaryGeneratedColumn(strategy: TStrategy = "uuid") {
  return (target: object, propertyName: string | symbol) => {
    const typeormDecorator = typeorm.PrimaryGeneratedColumn(strategy as any);
    typeormDecorator(target, propertyName);

    const className = target.constructor.name;
    ModelMeta.setColumnGqlType(className, String(propertyName), "ID");
  };
}

type TColumnDecorator = (target: object, propertyName: string | symbol) => void;

export function createColumnDecorator({ directive, columnOptions }: { directive?: string; columnOptions?: typeorm.ColumnOptions }): TColumnDecorator {
  return (target: object, columnName: string | symbol): void => {
    const entityName = target.constructor.name;
    if (ModelMeta.isColumnSynchronized(entityName, String(columnName)) === true) {
      // tslint:disable-next-line:no-console
      console.warn(
        `Some decorator for column "${entityName}"."${String(
          columnName
        )}" is not applied after Column is synchronized. Please put your decorator below @Column to be evaluated first.`
      );
      return;
    }
    if (directive != null) ModelMeta.addColumnDirective(entityName, String(columnName), directive);
    if (columnOptions != null) ModelMeta.addColumnOptions(entityName, String(columnName), columnOptions);
  };
}

export function createColumnDecoratorFactory<TParams>({
  getDirective,
  getColumnOptions
}: {
  getDirective?: (params: TParams) => string;
  getColumnOptions?: (params: TParams) => typeorm.ColumnOptions;
}): (params: TParams) => TColumnDecorator {
  return (params: TParams): TColumnDecorator => {
    return (target: object, propertyName: string | symbol): void => {
      const className = target.constructor.name;
      if (getDirective != null) ModelMeta.addColumnDirective(className, String(propertyName), getDirective(params));
      if (getColumnOptions != null) ModelMeta.addColumnOptions(className, String(propertyName), getColumnOptions(params));
    };
  };
}

export function OneToOneJoinColumn<T>(typeFunction: (type?: any) => new () => T) {
  return (target: object, columnName: string | symbol): void => {
    const entityName = target.constructor.name;
    // Need to wait for the next tick so all entity classes are laoded and typeFunction is correctly intialized.
    process.nextTick(() => {
      const identifier = typeFunction();
      if (identifier == null || identifier.name == null) {
        throw Error(`OneToOneJoinColumn.identifier.is.no.constructor for ${entityName}.${String(columnName)}`);
      }

      const foreignEntityName = identifier ? identifier.name : `Unknown${Math.floor(Math.random() * 100)}`;
      const relationName = entityName < foreignEntityName ? `${entityName}_${foreignEntityName}` : `${foreignEntityName}_${entityName}`;
      ModelMeta.setColumnGqlType(entityName, String(columnName), foreignEntityName);
      const directive = `@relation(name: "${relationName}")`;
      ModelMeta.addColumnDirective(entityName, String(columnName), directive);

      typeorm.JoinColumn()(target, columnName);
      typeorm.OneToOne(typeFunction)(target, columnName);
    });
  };
}
