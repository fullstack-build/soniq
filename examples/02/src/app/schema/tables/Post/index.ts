/* eslint-disable @typescript-eslint/typedef */
import { FilesColumn } from "@soniq/file-storage";
import { Table, GenericColumn, IdColumn, ManyToOneColumn, UpdateMutation, CreateMutation } from "@soniq/graphql";

import { anyone } from "../../expressions";
import { user } from "../User";

const post = new Table("Post", "soniq");

const postId = new IdColumn();
const title = new GenericColumn("title", "text");
const content = new GenericColumn("content", "text");
const owner = new ManyToOneColumn("owner", () => user);
const images = new FilesColumn("images2");

post.addColumn(0, postId, anyone);
post.addColumn(1, title, anyone);
post.addColumn(2, content, anyone);
post.addColumn(3, owner, anyone);
post.addColumn(4, images, anyone);

post.addMutation(new CreateMutation("Anyone", [title, content, owner, images], [anyone]));

post.addMutation(new UpdateMutation("Anyone", [postId, title, content, owner, images], [anyone]));

export { post, postId, title, content, owner };
