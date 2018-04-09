

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


//import { Container } from '../../packages/di/lib'

//import { FullstackOneCore } from '../../packages/fullstack-one/lib'
//import { Server } from '../../packages/server/lib'
//import { DbAppClient, DbGeneralPool } from '../../packages/db/lib'
//import { GraphQlParser } from '../../packages/graphql-parser/lib'
//import { GraphQl } from '../../packages/graphql/lib'
//import { GracefulShutdown } from '../../packages/graceful-shutdown/lib'
//import { AutoMigrate } from '../../packages/auto-migrate/lib'
//import { Email } from '../../packages/notifications/lib'

//import { DbGeneralPool } from '@fullstack-one/db';


import { Container } from '@fullstack-one/di'
import { FullstackOneCore } from 'fullstack-one'
import { GraphQl } from '@fullstack-one/graphql'
import { AutoMigrate } from '@fullstack-one/auto-migrate'
import { Auth } from '@fullstack-one/auth'
import { FileStorage } from '@fullstack-one/file-storage'

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $gql: GraphQl = Container.get(GraphQl);
//const $gs: GracefulShutdown = Container.get(GracefulShutdown);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);
const $auth: Auth = Container.get(Auth);
//const $email: Email = Container.get(Email);
const $fs: FileStorage = Container.get(FileStorage);
$one.boot();
