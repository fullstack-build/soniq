// tslint:disable:function-name
import "reflect-metadata";
import * as typeorm from "typeorm";

export const gQlObj: any = {};

export function Entity(name?: string, options?: any) {
  const typeormDecorator = typeorm.Entity(name, options);
  return (originalConstructor) => {
    const tableName = originalConstructor.name;
    gQlObj[originalConstructor.name] = { ...gQlObj[originalConstructor.name], schemaName: "public", tableName };

    return typeormDecorator(originalConstructor);
  };
}

export function Column(type?: any, options?: any) {
  const typeormDecorator = typeorm.Column(type, options);
  return (object, propertyName) => {
    const tableName = object.constructor.name;

    gQlObj[tableName] = { ...gQlObj[tableName] };
    gQlObj[tableName].properties = { ...gQlObj[tableName].properties };

    gQlObj[tableName].properties[propertyName] = {
      ...gQlObj[tableName].properties[propertyName],
      type: "String",
      nullable: true,
      name: propertyName
    };

    return typeormDecorator(object, propertyName);
  };
}

export function PrimaryGeneratedColumn(type?: any, options?: any) {
  const typeormDecorator = typeorm.PrimaryGeneratedColumn(type, options);
  return (object, propertyName) => {
    const tableName = object.constructor.name;

    gQlObj[tableName] = { ...gQlObj[tableName] };
    gQlObj[tableName].properties = { ...gQlObj[tableName].properties };

    gQlObj[tableName].properties[propertyName] = {
      ...gQlObj[tableName].properties[propertyName],
      type: "ID",
      nullable: false,
      name: propertyName
    };

    return typeormDecorator(object, propertyName);
  };
}
