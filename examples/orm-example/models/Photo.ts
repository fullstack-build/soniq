import * as typeorm from "typeorm";
import { Entity, Column, PrimaryGeneratedColumn, gqlFieldType, createColumnDecorator, createColumnDecoratorFactory, pgType, OneToOneJoinColumn } from "@fullstack-one/db";
import User from "./User";

const myDecorator = createColumnDecorator({ directive: "@myDirective" });
const myDecoratorFactory = createColumnDecoratorFactory<{ max: number }>({ getDirective: ({ max }) => `@myParamDirective(max: ${max})` });

const unique = createColumnDecorator({ columnOptions: { unique: true } });

const String = gqlFieldType("String");
const Int = gqlFieldType("Int");
const Boolean = gqlFieldType("Boolean");

@Entity()
export default class Photo extends typeorm.BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id: number;

  @Column()
  @String
  @pgType.string
  public name: string;

  // @Column()
  // @Int
  // @pgType.integer
  // public views: number;

  // @Column()
  // @String
  // @pgType.string
  // @unique
  // public somethingUnique: string

  // @Column()
  // @String
  // @pgType.string
  // public username: string;

  // @Column()
  // @String
  // @pgType.string
  // @myDecorator
  // public password: string;

  // @Column()
  // @Int
  // @pgType.integer
  // @myDecoratorFactory({ max: 2 })
  // public clicks: number;

  // @Column()
  // @Boolean
  // @pgType.boolean
  // public hasProofedEmail: boolean;

  // @OneToOneJoinColumn(type => User)
  // public user: User;
}
