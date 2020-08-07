import { SoniqApp, ExtensionsModule } from "soniq";
import { AuthModule } from "@soniq/auth";
import { GraphQlModule } from "@soniq/graphql";
import { GraphqlPlaygroundModule } from "@soniq/graphql-playground";
import { schema } from "./schema";

import "./envs/dev";
import "./envs/prod";
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
    introspectionActive: true,
    dangerouslyExposeErrorDetails: true,
  },
});

const serverModule: ServerModule = new ServerModule({});

const extensionsModule: ExtensionsModule = new ExtensionsModule([
  {
    name: "example",
    mainPath: require.resolve("./extensions/example"),
  },
  /*{
    name: "example3",
    mainPath: require.resolve("./extensions/example2"),
  },*/
]);

const playgroundModule: GraphqlPlaygroundModule = new GraphqlPlaygroundModule({});

app.addModule(authModule);
app.addModule(graphqlModule);
app.addModule(serverModule);
app.addModule(extensionsModule);
app.addModule(playgroundModule);
