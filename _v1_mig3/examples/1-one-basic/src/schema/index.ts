
import { Schema } from "@fullstack-one/graphql";

const schema = new Schema(["soniq"]);

import { user } from "./tables/User";
import { post } from "./tables/Post";

schema.addTable(0, user);
schema.addTable(1, post);

const res = schema._build("a3af9ea0-11a7-4eb0-96a0-7be79f827779");

export default res;