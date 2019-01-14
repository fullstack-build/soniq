import ava, { ExecutionContext } from "ava";
import { Config } from "../lib/index";

ava.beforeEach("Set mock application path", (test) => {
  process.env["Foo.bat"] = "process.env";
  process.env["Foo.processEnvironment.text"] = "process.env";
  process.env["Foo.processEnvironment.trueBoolean"] = "true";
  process.env["Foo.processEnvironment.falseBoolean"] = "false";
  const applicationPath = `${__dirname}/mock/application/`;
  require.main.filename = `${applicationPath}/index.js`;

  test.context = { applicationPath };
});

ava("Construct config ENVIRONMENT", (test: ExecutionContext<{ applicationPath: string }>) => {
  const config = new Config();

  test.is(config.ENVIRONMENT.NODE_ENV, "test");
  test.is(config.ENVIRONMENT.frameworkVersion, require("../package.json").version);
  test.is(config.ENVIRONMENT.name, "mockapplication");
  test.is(config.ENVIRONMENT.namespace, "application-default");
  test.is(config.ENVIRONMENT.nodeId.length, 6);
  test.is(config.ENVIRONMENT.path, test.context.applicationPath);
  test.is(config.ENVIRONMENT.version, "1.0.0");
});

ava("Register application config module from default.js, test.js and process.env", (test) => {
  const config = new Config();
  config.registerApplicationConfigModule("Foo");

  const expectedFooConfig = {
    processEnvironment: {
      text: "process.env",
      trueBoolean: true,
      falseBoolean: false
    },
    bat: "process.env",
    bar: "application-test",
    baz: "application-default"
  };
  test.deepEqual(config.getConfig("Foo"), expectedFooConfig);
});

ava("Register config module", (test) => {
  const config = new Config();
  const configModuleName = "Bar";
  const configDirectory = `${__dirname}/mock/module-config-bar`;

  const value = config.registerConfig(configModuleName, configDirectory);
  const expectedConfigModule = {
    bar: 2,
    blub: "foo"
  };
  test.deepEqual(value, expectedConfigModule);
  test.deepEqual(config.getConfig(configModuleName), expectedConfigModule);
});

ava("Register config module and get overwritten by application default config", (test) => {
  const config = new Config();
  const configModuleName = "Bat";
  const configDirectory = `${__dirname}/mock/module-config-bat`;

  const value = config.registerConfig(configModuleName, configDirectory);
  const expectedConfigModule = {
    baa: "application-default",
    boo: "module-test",
    buu: "module-default"
  };
  test.deepEqual(value, expectedConfigModule);
  test.deepEqual(config.getConfig(configModuleName), expectedConfigModule);
});

ava("Register config module with falsy path", (test) => {
  const config = new Config();
  const configModuleName = "I_Do_Not_Exist";
  const configDirectory = `${__dirname}/i/do/not/exist`;

  try {
    config.registerConfig(configModuleName, configDirectory);
    test.fail();
  } catch {
    test.pass();
  }
});

ava("Register config module for existing moduleName", (test) => {
  const config = new Config();
  const configModuleName = "Config";
  const configDirectory = `${__dirname}/mock/module-config-bat`;

  const expectedConfigModule = {
    namespace: "application-default"
  };
  const value = config.registerConfig(configModuleName, configDirectory);
  test.deepEqual(value, expectedConfigModule);
  test.deepEqual(config.getConfig(configModuleName), expectedConfigModule);
});

ava("Throw error on missing config property", (test) => {
  const config = new Config();
  const configModuleName = "Blub";
  const configDirectory = `${__dirname}/mock/module-config-blub`;

  try {
    config.registerConfig(configModuleName, configDirectory);
    test.fail();
  } catch {
    test.pass();
  }
});

ava("Throw error on getConfig for unknown module name", (test) => {
  const config = new Config();

  try {
    config.getConfig("FooBarBlub");
    test.fail();
  } catch {
    test.pass();
  }
});
