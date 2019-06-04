import "reflect-metadata";
import { BaseEntity, Entity, Column, PrimaryGeneratedColumn } from "@fullstack-one/db";

function classDecorator(constructor: Function) {
  console.log("* classDecorator", constructor.name);
}

function methodDecorator() {
  console.log("methodDecorator(): evaluated");
  return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("methodDecorator(): target", target);
    console.log("methodDecorator(): propertyKey", propertyKey);
    console.log("methodDecorator(): descriptor", descriptor);
  };
}

function propertyDecorator(target: any, propertyKey: string | symbol) {
  console.log("* propertyDecorator", target, propertyKey);
}

@Entity("Photo")
@classDecorator
export class Photo extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column()
  @propertyDecorator
  public description: string;

  @Column()
  public filename: string;

  @Column()
  public views: number;

  @Column()
  public isPublished: boolean;

  @methodDecorator()
  public test() {}
}
