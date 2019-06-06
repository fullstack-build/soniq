import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, gqlFieldType, unique, createColumnDecorator, createColumnDecoratorFactory } from "@fullstack-one/db";

const myDecorator = createColumnDecorator("@myDirective");
const myDecoratorFactory = createColumnDecoratorFactory<{ max: number }>(({ max }) => `@myParamDirective(max: ${max})`)

const String = gqlFieldType("String");
const Int = gqlFieldType("Int");
const Boolean = gqlFieldType("Boolean");

@Entity("Photo")
export class Photo extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id: number;

  @Column()
  @String
  public name: string;

  @Column()
  @Int
  public views?: number;

  @Column()
  @unique
  @String
  public somethingUnique: string

  @Column()
  @String
  public username?: string;

  @Column()
  @String
  @myDecorator
  public password?: string;

  @Column()
  @Int
  @myDecoratorFactory({ max: 2 })
  public clicks?: number;

  @Column()
  @Boolean
  public hasProofedEmail: boolean

  // @ORM.ComputedColumn()
  // public isPublished: boolean;
}
