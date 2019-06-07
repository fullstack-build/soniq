import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, gqlFieldType, createColumnDecorator, createColumnDecoratorFactory, pgType } from "@fullstack-one/db";

const myDecorator = createColumnDecorator({ directive: "@myDirective" });
const myDecoratorFactory = createColumnDecoratorFactory<{ max: number }>({ getDirective: ({ max }) => `@myParamDirective(max: ${max})` });

const unique = createColumnDecorator({ columnOptions: { unique: true } });

const String = gqlFieldType("String");
const Int = gqlFieldType("Int");
const Boolean = gqlFieldType("Boolean");

@Entity()
export class Photo extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id: number;

  @Column()
  @String
  @pgType.string
  public name: string;

  @Column()
  @Int
  @pgType.integer
  public views?: number;

  @Column()
  @String
  @pgType.string
  @unique
  public somethingUnique: string

  @Column()
  @String
  @pgType.string
  public username?: string;

  @Column()
  @String
  @pgType.string
  @myDecorator
  public password?: string;

  @Column()
  @Int
  @pgType.integer
  @myDecoratorFactory({ max: 2 })
  public clicks?: number;

  @Column()
  @Boolean
  @pgType.boolean
  public hasProofedEmail: boolean

  // @ORM.ComputedColumn()
  // public isPublished: boolean;
}
