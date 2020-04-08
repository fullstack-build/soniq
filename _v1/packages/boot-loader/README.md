# @fullstack.one/boot-loader
Boot management for fullstack-one packages and applications, but also general purpose boot manager based on `typedi`.

## Installation

```sh
npm install --save @fullstack-one/boot-loader
```

## Usage

```ts
import { BootLoader } from "@fullstack-one/boot-loader";

const bootLoader = Container.get(BootLoader);
bootLoader.addBootFunction("some name", () => {
  // do some stuff
});
bootLoader.addBootFunction("some async name", async () => {
  // do some async stuff
});

await bootLoader.boot();
```

Find more examples in the [tests directory](test) or read the [code](lib).
