# Commands

Install dependencies:

```
npm install -g @microsoft/rush
```

Initialize the project:

```
$ rush init
```

Update packages and rebuild.

```
$ rush update --full
$ rush rebuild
```

Publish to NPM:

```
$ rush version --bump
$ rush publish --publish --include-all
```

Check dependencies of each package.

```
$ rush check
```

# Custom commands

Open `common/config/rush/command-line.json` and add a custom command.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/command-line.schema.json",
  "commands": [
    {
      "commandKind": "bulk",
      "name": "test",
      "summary": "Test packages.",
      "description": "Executes automated tests.",
      "enableParallelism": true
    }
  ],
  "parameters": []
}
```

You can now run `rush test` to run it.

# Publish policy

Open `common/config/version-policies.json` and add a policy.

```json
[
  {
    "policyName": "framework",
    "definitionName": "lockStepVersion",
    "version": "1.3.2",
    "nextBump": "patch"
  }
]
```

Open `rush.json` and attach this policy to each package.

```json
{
   "projects": [
    {
      "packageName": "@soniq/queue",
      "projectFolder": "modules/queue",
      "versionPolicyName": "framework"
    }
    ...
   ],
}
```

Bump packages and publish all to NPM.

```
$ rush version --bump
$ rush publish --publish --include-all
```

Override the policy versioning.

```
$ rush version --bump --override-bump minor
```