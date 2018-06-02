// configure and read .env
require('dotenv').config();

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

import { Container } from '@fullstack-one/di';
import { FullstackOneCore } from 'fullstack-one';
import { GraphQl } from '@fullstack-one/graphql';
import { AutoMigrate } from '@fullstack-one/auto-migrate';
import { DbGeneralPool } from '@fullstack-one/db';
import { Auth } from '@fullstack-one/auth';
import { FileStorage } from '@fullstack-one/file-storage'

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $gql: GraphQl = Container.get(GraphQl);
// const $gs: GracefulShutdown = Container.get(GracefulShutdown);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);
const auth: Auth = Container.get(Auth);
// const $email: Email = Container.get(Email);
const $fs: FileStorage = Container.get(FileStorage);

auth.setNotificationFunction(async (user, caller, meta) => {
  console.log('> NOTIFY!', user.userId, caller, meta);
  console.log('>', user.accessToken);
});

(async () => {
  await $one.boot();

  /*const posts = (await $auth.adminQuery('SELECT * FROM "VPost"')).rows;
  console.log('Posts query: ', posts);

  await auth.adminTransaction(async (dbClient) => {
    console.log('Posts transaction: ', (await dbClient.query('SELECT * FROM "VPost"')).rows);
  });*/

})();
