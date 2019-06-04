import "reflect-metadata";
import * as ORM from "@fullstack-one/db";

function Entity(name?: string, options?: any) {
  /*console.log(">>> Entity found", name);
  return ORM.Entity(name, options);*/
  const x = ORM.Entity(name, options);
  return function(originalConstructor) {
    console.log(">>> Entity found", originalConstructor.name);
    return x(originalConstructor);
  };
}

function Column(type?: any, options?: any) {
  const x = ORM.Column(type, options);
  return function(object, propertyName) {
    console.log(">>> Property found", propertyName, `(${object.constructor.name})`);
    return x(object, propertyName);
  };
}

@Entity("Photo")
export class Photo extends ORM.BaseEntity {
  @ORM.PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column()
  public description: string;

  @Column()
  public filename: string;

  @Column()
  public views: number;

  @Column()
  public isPublished: boolean;
}
