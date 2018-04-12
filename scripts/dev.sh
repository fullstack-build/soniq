npm install
sh pkg.sh
lerna link --force-local
cd examples/fullstack-one-example
npm link @fullstack-one/di
npm link @fullstack-one/graphql
npm link @fullstack-one/auto-migrate
npm link @fullstack-one/auth
npm link @fullstack-one/file-storage
npm link fullstack-one