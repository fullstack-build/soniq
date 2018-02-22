

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


import { Container } from '../../packages/di/lib'

import { FullstackOneCore } from '../../packages/fullstack-one/lib'
//import { Server } from '../../packages/server/lib'
//import { DbAppClient, DbGeneralPool } from '../../packages/db/lib'
//import { GraphQlParser } from '../../packages/graphql-parser/lib'
import { GraphQl } from '../../packages/graphql/lib'
import { GracefulShutdown } from '../../packages/graceful-shutdown/lib'
import { AutoMigrate } from '../../packages/auto-migrate/lib'
import { Email } from '../../packages/notifications/lib'

const $one: FullstackOneCore = Container.get(FullstackOneCore);
//const $server: Server = Container.get(Server);
//const $dbAppClient: DbAppClient = Container.get(DbAppClient);
//const $dbGeneralPool: DbGeneralPool = Container.get(DbGeneralPool);
//const $gqlParser: GraphQlParser = Container.get(GraphQlParser);
const $gql: GraphQl = Container.get(GraphQl);
const $gs: GracefulShutdown = Container.get(GracefulShutdown);
const $autoMigrate: AutoMigrate = Container.get(AutoMigrate);
//const $email: Email = Container.get(Email);
$one.boot();
