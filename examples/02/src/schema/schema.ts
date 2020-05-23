import { Schema } from "@soniq/graphql";

export const schema: Schema = new Schema(["soniq"]);

import { user } from "./tables/User";
import { post } from "./tables/Post";

schema.addTable(0, user);
schema.addTable(1, post);
