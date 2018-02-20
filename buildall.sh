
cd packages/fullstack-one
rm -rf ./dist
npm run build
cd ../db
rm -rf ./dist
npm run build
cd ../migration
rm -rf ./dist
npm run build
cd ../graphql
rm -rf ./dist
npm run build
cd ../events
rm -rf ./dist
npm run build
cd ../helper
rm -rf ./dist
npm run build
cd ../queue
rm -rf ./dist
npm run build
cd ../auth
rm -rf ./dist
npm run build
cd ../logger
rm -rf ./dist
npm run build
cd ../notifications
rm -rf ./dist
npm run build
cd ../../
