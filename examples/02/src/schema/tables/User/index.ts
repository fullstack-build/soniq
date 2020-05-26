/* eslint-disable @typescript-eslint/typedef */
import {
  GenericColumn,
  IdColumn,
  OneToManyColumn,
  ComputedColumn,
  EnumColumn,
  Table,
  CreateMutation,
  Index,
  Check,
  UpdateMutation,
  DeleteMutation,
} from "@soniq/graphql";

import { ownerById, currentUserId, anyone } from "../../expressions";
import { owner as postOwner } from "../Post";

export const user = new Table("User", "soniq");

const userId = new IdColumn();
const firstName = new GenericColumn("firstName", "text", { nullable: true });
const lastName = new GenericColumn("lastName", "text", { nullable: true });
export const posts = new OneToManyColumn("posts", () => postOwner);
const currentUser = new ComputedColumn("currentUser", () => currentUserId);
const gender = new EnumColumn("gender", ["male", "female", "diverse"], {
  nullable: true,
});
const age = new GenericColumn("age", "int", { defaultExpression: "0" });

user.addColumn(0, userId, anyone);
user.addColumn(1, firstName, anyone);
user.addColumn(2, lastName, ownerById);
user.addColumn(3, posts, anyone);
user.addColumn(4, currentUser, anyone);
user.addColumn(5, gender, anyone);
user.addColumn(8, age, anyone);

user.addMutation(new CreateMutation("Me", [firstName, lastName], [anyone]));
user.addMutation(new UpdateMutation("Me", [userId, firstName, lastName], [ownerById]));
user.addMutation(new DeleteMutation(userId, [ownerById]));

user.addIndex(new Index([firstName, lastName], { isUniqueIndex: true }));

user.addCheck(new Check(`("firstName" !~~ \'%fuck%\'::text)`));

// TODO: @eugene This is a check which will be autoFixed
// user.addCheck(new Check(`("firstName" NOT LIKE \'%fuck%\'::text)`));
