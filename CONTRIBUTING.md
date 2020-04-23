# Contribute to soniq

The soniq modules are developed in the **rushstack** monorepo on GitHub:

  [https://github.com/fullstack-build/soniq](https://github.com/fullstack-build/soniq)


## Setting up your machine

**Node.js 12 or newer**: We recommend to use [nvm](https://github.com/creationix/nvm) (for Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) (for Windows) so that you can easily switch between different NodeJS engine verisons.  When installing NodeJS, make sure to first uninstall any previous versions and clean up their files.  See [FAQ: After installing Rush, why am I stilling see the old version?](https://github.com/Microsoft/rushstack/wiki/Rush-~-FAQ#after-installing-rush-why-am-i-stilling-see-the-old-version) for more about this.


## Building the projects

We use the [Rush](http://rushjs.io) tool for building projects in the **rushstack** monorepo.

1. Make sure you have the latest release of Rush:
```
npm install -g @microsoft/rush
```

2. Clone the repo:
```
git clone https://github.com/fullstack-build/soniq
```

3. Use rush to install the package dependencies:
```
cd soniq
rush install
```

4. Rebuild all the projects in the repo:
```
rush rebuild
```

5. If you want to build just one project:
```
cd modules/Core
rushx build
```

**Important**: You generally should **not** use commands like `npm install` in a Rush repo.  See the
[Rush documentation](https://rushjs.io/pages/developer/new_developer/) for more information about this tool.

## Submitting a Pull Request

We welcome contributions! To submit a feature for one of the **soniq** modules:

1. Fork the repo.
2. Create a Git branch and commit your changes.
3. If you modified any package.json files, run `rush update` to make sure your **lock.json** file is up to date.
   Commit any changes made to that file.
4. Before creating your PR, run `rush change`; if prompted, [enter a change log message](https://rushjs.io/pages/best_practices/change_logs/), and commit the files that get created.
5. Create a [pull request](https://help.github.com/articles/creating-a-pull-request/)
6. If your PR primarily affects a single project, add the project name as a prefix to your PR title.  For example: "**[Logger] Added a new feature**" or "**[Core] Fixed a bug**".

Someone is going to review your PR.
