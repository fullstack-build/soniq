import ava, { ExecutionContext } from "ava";

import { LoggerFactory } from "@fullstack-one/logger";
import { Container } from "@fullstack-one/di";
import { FakeLoggerFactory } from "./mock/FakeLoggerFactory";
import { BootLoader, EBootState } from "../lib/index";
import { bootWithTimeoutMock } from "./mock/bootFunctions";
import { BootMock } from "./mock/BootMock";
import { AfterBootMock } from "./mock/AfterBootMock";
import IStateSpy from "./helpers/IStateSpy";

interface ITestContext {
  id: number;
}

ava.beforeEach("Set test id", (test: ExecutionContext<ITestContext>) => {
  test.context.id = Math.random();
  Container.of(test.context.id).set(LoggerFactory, new FakeLoggerFactory());
});

ava.afterEach("Reset container for test id", (test: ExecutionContext<ITestContext>) => {
  Container.of(test.context.id).reset();
});

ava("Initial state", (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);

  test.is(bootLoader.hasBooted(), false);
  test.is(bootLoader.isBooting(), false);
  test.is(bootLoader.getBootState(), EBootState.Initial);
});

ava("State while booting", (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);
  bootLoader.addBootFunction("boot function with timeout", bootWithTimeoutMock);
  bootLoader.boot();

  test.is(bootLoader.hasBooted(), false);
  test.is(bootLoader.isBooting(), true);
  test.is(bootLoader.getBootState(), EBootState.Booting);
});

ava("Final state", (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);
  bootLoader.boot();

  test.is(bootLoader.hasBooted(), true);
  test.is(bootLoader.isBooting(), false);
  test.is(bootLoader.getBootState(), EBootState.Finished);
});

ava("Add boot function, boot and get boot result", async (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);
  const stateSpy: IStateSpy = { bootState: null };
  const bootable = new BootMock(bootLoader, stateSpy);
  const expectedPropertyAfterBoot = "new property";
  await bootLoader.boot();

  test.deepEqual(stateSpy, { bootState: EBootState.Booting });
  test.is(bootable.property, expectedPropertyAfterBoot);
});

ava("Add after boot function, boot and get after boot result", async (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);
  const stateSpy: IStateSpy = { bootState: null };
  const bootable = new AfterBootMock(bootLoader, stateSpy);
  const expectedPropertyAfterBoot = "new property";
  await bootLoader.boot();

  test.deepEqual(stateSpy, { bootState: EBootState.Finished });
  test.is(bootable.property, expectedPropertyAfterBoot);
});

ava("Get ready Promise and before has booted", async (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);
  bootLoader.addBootFunction("boot function with timeout", bootWithTimeoutMock);
  bootLoader.boot();
  await bootLoader.getReadyPromise();

  test.deepEqual(bootLoader.hasBooted(), true);
  test.deepEqual(bootLoader.isBooting(), false);
});

ava("Get ready Promise and when has booted", async (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);
  bootLoader.addBootFunction("boot function with timeout", bootWithTimeoutMock);
  await bootLoader.boot();
  await bootLoader.getReadyPromise();

  test.deepEqual(bootLoader.hasBooted(), true);
  test.deepEqual(bootLoader.isBooting(), false);
});

ava("Throw an error if boot function throws an error", async (test: ExecutionContext<ITestContext>) => {
  const bootLoader = Container.of(test.context.id).get(BootLoader);
  bootLoader.addBootFunction("boot function throws an error", Promise.reject);
  try {
    await bootLoader.boot();
    test.fail();
  } catch {
    test.pass();
  }
});
