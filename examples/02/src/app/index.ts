import { SoniqApp } from "soniq";
import { AuthModule } from "@soniq/auth";
import { GraphQlModule } from "@soniq/graphql";
import { schema } from "../schema/schema";

import {} from "./envs/dev";
import {} from "./envs/prod";
import { ServerModule } from "@soniq/server";

export const app: SoniqApp = new SoniqApp("a3af9ea0-11a7-4eb0-96a0-7be79f827779");

const authModule: AuthModule = new AuthModule({
  secrets: {
    admin: "HyperHyper",
    root: "ThisIsScooter",
    cookie: "FooBar",
    authProviderHashSignature: "test1234",
    encryptionKey: "qcJVt6ASy9Ew2nRV5ZbhZEzAahn8fwjL",
  },
});

const graphqlModule: GraphQlModule = new GraphQlModule({
  schema,
  options: {
    playgroundActive: true,
    introspectionActive: true,
  },
});

const serverModule: ServerModule = new ServerModule({});

app.addModule(authModule);
app.addModule(graphqlModule);
app.addModule(serverModule);
