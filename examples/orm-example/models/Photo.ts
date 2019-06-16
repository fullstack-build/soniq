import { BaseEntity, createColumnDecorator, createColumnDecoratorFactory, Entity, PrimaryGeneratedColumn, Column } from "@fullstack-one/db";

const myDecorator = createColumnDecorator({ directive: "@myDirective" });
const myDecoratorFactory = createColumnDecoratorFactory<{ max: number }>({ getDirective: ({ max }) => `@myParamDirective(max: ${max})` });

@Entity({ schema: "public" })
export default class Photo extends BaseEntity {
  @PrimaryGeneratedColumn({ comment: "This is a very important id column." })
  public id: number;

  @Column({ gqlType: "String", type: "character varying" })
  public name: string;
}
