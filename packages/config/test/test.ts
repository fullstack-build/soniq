import ava, { ExecutionContext } from "ava";
import { Config } from "../lib/index";

ava.beforeEach("Set mock project path", (test) => {
  process.env["Foo.bat"] = "process.env";
  process.env["Foo.processEnvironment.text"] = "process.env";
  process.env["Foo.processEnvironment.trueBoolean"] = "true";
  process.env["Foo.processEnvironment.falseBoolean"] = "false";
  const projectPath = `${__dirname}/mock/project/`;
  require.main.filename = `${projectPath}/index.js`;

  test.context = { projectPath };
});

ava("Construct config ENVIRONMENT", (test: ExecutionContext<{ projectPath: string }>) => {
  const config = new Config();

  test.is(config.ENVIRONMENT.NODE_ENV, "test");
  test.is(config.ENVIRONMENT.frameworkVersion, require("../package.json").version);
  test.is(config.ENVIRONMENT.name, "mockproject");
  test.is(config.ENVIRONMENT.namespace, "project-default");
  test.is(config.ENVIRONMENT.nodeId.length, 6);
  test.is(config.ENVIRONMENT.path, test.context.projectPath);
  test.is(config.ENVIRONMENT.version, "1.0.0");
});

ava("Construct project config from default.js, test.js and process.env", (test) => {
  const config = new Config();

  const expectedFooConfig = {
    processEnvironment: {
      text: "process.env",
      trueBoolean: true,
      falseBoolean: false
    },
    bat: "process.env",
    bar: "project-test",
    baz: "project-default"
  };
  test.deepEqual(config.getConfig("Foo"), expectedFooConfig);
});

ava("Register config module", (test) => {
  const config = new Config();
  const configModuleName = "Bar";
  const configModulePath = `${__dirname}/mock/module-config-bar`;

  const value = config.registerConfig(configModuleName, configModulePath);
  const expectedConfigModule = {
    bar: 2,
    blub: "foo"
  };
  test.deepEqual(value, expectedConfigModule);
  test.deepEqual(config.getConfig(configModuleName), expectedConfigModule);
});

ava("Register config module and get overwritten by project default config", (test) => {
  const config = new Config();
  const configModuleName = "Bat";
  const configModulePath = `${__dirname}/mock/module-config-bat`;

  const value = config.registerConfig(configModuleName, configModulePath);
  const expectedConfigModule = {
    baa: "project-default",
    boo: "module-test",
    buu: "module-default"
  };
  test.deepEqual(value, expectedConfigModule);
  test.deepEqual(config.getConfig(configModuleName), expectedConfigModule);
});

ava.skip("Register config module with falsy path", (test) => {
  const config = new Config();
  const configModuleName = "I_Do_Not_Exist";
  const configModulePath = `${__dirname}/i/do/not/exist`;

  try {
    config.registerConfig(configModuleName, configModulePath);
    test.fail("Should throw Error");
  } catch {
    test.pass();
  }
});

ava("Register config module for existing moduleName", (test) => {
  const config = new Config();
  const configModuleName = "Foo";
  const configModulePath = `${__dirname}/mock/module-config-bar`;

  try {
    config.registerConfig(configModuleName, configModulePath);
    test.fail("Should throw Error");
  } catch {
    test.pass();
  }
});

ava("Fail get config for unknown module name", (test) => {
  const config = new Config();

  try {
    config.getConfig("FooBarBlub");
    test.fail("Should throw Error");
  } catch {
    test.pass();
  }
});
