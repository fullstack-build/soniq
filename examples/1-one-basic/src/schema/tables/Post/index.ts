import { Table, GenericColumn, IdColumn, ManyToOneColumn } from "@fullstack-one/graphql";

import { ownerById, ownerByOwnerId, anyone } from "../../expressions";
import { user } from "../User";

export const post = new Table("Post", "soniq");

export const postId = new IdColumn();
export const title = new GenericColumn("title", "text");
export const content = new GenericColumn("content", "text");
export const owner = new ManyToOneColumn("owner", () => user);

post.addColumn(0, postId, anyone);
post.addColumn(1, title, anyone);
post.addColumn(2, content, anyone);
post.addColumn(3, owner, anyone);