# @fullstack-one/config
Configuration management for fullstack-one packages and applications.

## General

A configuration module is a configuration registered with `@fullstack-one/config` singleton, e.g. by other `@fullstack-one` packages.

An application is the main program, that utilizes the `@fullstack-one` framework.

The main idea is, that each package registers a configuration module with a set of properties it requires to run. The values of those properties depend on multiple configuration sources, that are merged in a fixed hierarchy. The following shows the merging hierarchy with the primary configuration on top and the most subsidiary configuration at the bottom:

```sh
process.env configuration
  ↑
application environment configuration
  ↑
application default configuration
  ↑
module environment configuration
  ↑
module default configuration
```

**Hint:** If any value is still null after the merge, `@fullstack-one/config` will throw an error.

## Setup

### Setup for @fullstack-one packages

First add the config package as a dependency to your package:

```sh
npm install --save @fullstack-one/config
```

Load the config singleton using the `@fullstack-one/di` package and register your configuration via the path of your `config` directory as a configuration module, e.g.:

```ts
import { Config } from "@fullstack-one/config";

class MyFullstackOnePackage {
  
  private myConfig: Config;


  constructor(@Inject((type) => Config) config) {

    this.myConfig = config.registerConfig("MyConfig", `${__dirname}/../config`);
}
```

`@fullstack-one/config` goes into the specified directory and tries to find the `default.js`. Additionally, the environment config, e.g. `development.js`, is loaded based on `process.env.NODE_ENV`. The default configuration is mandatory (if not given an error is thrown) and the environment configuration is optional. The configuration directory may look like this:

```sh
$ cd config && find .
.
./default.js
./development.js
./test.js
./production.js
```

The configuration files only describe the configuration module and may look like this:

```js
module.exports = {
  'a': true,
  'b': {
    'c': null,
    'd': 'foo'
  }
}
```

### Setup in the Application

As soon as any `@fullstack-one` package is loaded and initialized, that uses `@fullstack-one/config`, the application is required to have a `./package.json` and a `./config` directory on the same level as its main file (given by `require.main.filename`). If one of these is not given, `@fullstack-one/config` throws an error.

Analogously to the packages, the application has to have a `default.js` and may have environment configuration files. The application's configuration files do not describe only one configuration module, but all in one object, e.g.:

```js
module.exports = {
  'MyFullstackOnePackage': {
    'a': true,
    'b': {
      'c': null,
      'd': 'foo'
    }
  },
  'Package2': { ... },
  ...
}
```

**Hint:** It does not have to include all properties, as the objects will be merged.

### Setup the process environment

On registration of a configuration module the process environment is loaded via `process.env`. The name of the variable is interpreted as path in the whole configuration object. For example, the following process environment variable would lead to the respective change in the config object:

```sh
export MyFullstackOnePackage.b.c=changed
````

```json
{
  "MyFullstackOnePackage": {
    "a": true,
      "b": {
        "c": "changed",
        "d": "foo"
      }
    },
  "Package2": { ... },
  ...
}
```

## Usage

You can use `registerConfig(moduleName, configDirPath)`, `registerApplicationConfigModule(moduleName, configObject)` and `getConfig(moduleName)` as described above. Find examples in `./test`.

### Dangerzone

You can also get the whole config object containing all config modules using `dangerouslyGetWholeConfig()`. If you are in the middle of a boot process for example, some config modules might have not been set.
