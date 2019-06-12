import "reflect-metadata";
import * as typeorm from "typeorm";
import { Entity, Column, PrimaryGeneratedColumn, gqlFieldType, pgType, OneToOneJoinColumn, setEnum, nullable } from "@fullstack-one/db";
import Photo from "./Photo";

const String = gqlFieldType("String");

export enum Size {
  small,
  medium,
  large
}

@Entity()
export default class User extends typeorm.BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id: number;

  @Column()
  @String
  @pgType.string
  public name: string;

  @OneToOneJoinColumn((type) => Photo)
  public photo: Photo;

  // @Column()
  // @setEnum("Size", Size)
  // public size?: Size;

  // @Column()
  // @setEnum("Size2", Size)
  // public size2?: Size;

  // @Column()
  // @String
  // @pgType.string
  // @nullable
  // public iCanBeNull: string;
}
