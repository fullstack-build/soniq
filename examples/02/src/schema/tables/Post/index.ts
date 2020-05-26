/* eslint-disable @typescript-eslint/typedef */
import { Table, GenericColumn, IdColumn, ManyToOneColumn } from "@soniq/graphql";

import { anyone } from "../../expressions";
import { user } from "../User";

const post = new Table("Post", "soniq");

const postId = new IdColumn();
const title = new GenericColumn("title", "text");
const content = new GenericColumn("content", "text");
const owner = new ManyToOneColumn("owner", () => user);

post.addColumn(0, postId, anyone);
post.addColumn(1, title, anyone);
post.addColumn(2, content, anyone);
post.addColumn(3, owner, anyone);

export { post, postId, title, content, owner };
