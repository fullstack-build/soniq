npm install
sh ./scripts/pkg.sh
lerna link --force-local
cd examples/fullstack-one-example
npm install
npm link @fullstack-one/graceful-shutdown
npm link @fullstack-one/di
npm link @fullstack-one/graphql
npm link @fullstack-one/auto-migrate
npm link @fullstack-one/auth
npm link @fullstack-one/file-storage
npm link @fullstack-one/graceful-shutdown
npm link @fullstack-one/db
npm link @fullstack-one/auth-fb-token
npm link @fullstack-one/notifications
npm link @fullstack-one/events
npm link fullstack-one