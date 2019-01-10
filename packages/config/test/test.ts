import ava, { ExecutionContext } from "ava";
import { Config } from "../lib/index";

ava.beforeEach("Set mock project path", (test) => {
  const projectPath = `${__dirname}/mockproject/`;
  require.main.filename = `${projectPath}/index.js`;

  test.context = { projectPath };
});

ava("Construct config ENVIRONMENT", (test: ExecutionContext<{ projectPath: string }>) => {
  const config = new Config();

  test.is(config.ENVIRONMENT.NODE_ENV, "test");
  test.is(config.ENVIRONMENT.frameworkVersion, require("../package.json").version);
  test.is(config.ENVIRONMENT.name, "mockproject");
  test.is(config.ENVIRONMENT.namespace, "mock");
  test.is(config.ENVIRONMENT.nodeId.length, 6);
  test.is(config.ENVIRONMENT.path, test.context.projectPath);
  test.is(config.ENVIRONMENT.version, "1.0.0");
});
