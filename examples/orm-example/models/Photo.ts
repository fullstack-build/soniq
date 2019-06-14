import * as typeorm from "typeorm";
import { createColumnDecorator, createColumnDecoratorFactory, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";
import User from "./User";

const myDecorator = createColumnDecorator({ directive: "@myDirective" });
const myDecoratorFactory = createColumnDecoratorFactory<{ max: number }>({ getDirective: ({ max }) => `@myParamDirective(max: ${max})` });

@Entity({ schema: "other" })
export default class Photo extends typeorm.BaseEntity {
  @PrimaryGeneratedColumn({ comment: "This is a very important id column." })
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  public name: string;
}
