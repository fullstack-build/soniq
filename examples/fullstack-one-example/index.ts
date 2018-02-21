
import { Container } from '../../packages/di/lib'

import { FullstackOneCore } from '../../packages/fullstack-one/lib'
import { Server } from '../../packages/server/lib'
import { GraphQl } from '../../packages/graphql/lib'

const $one: FullstackOneCore = Container.get(FullstackOneCore);
const $server: Server = Container.get(Server);
const $gql: GraphQl = Container.get(GraphQl);
$one.boot();
