
cd packages/fullstack-one
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../db
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../migration
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../graphql
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../events
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../helper
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../queue
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../auth
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../logger
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../notifications
mv ./src/* ./lib
rm -rf ./src
mkdir ./dist
cp ../../tsconfig_packages.json ./tsconfig.json
npm i typescript -D

cd ../../
