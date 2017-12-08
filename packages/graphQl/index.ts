import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';
import * as koaBody from 'koa-bodyparser';
import * as KoaRouter from 'koa-router';

// import sub modules
import { graphQl as gQLHelper } from './helper';
export * from './migration';

import { runtimeParser } from './parser';
import { getResolvers } from './queryBuilder/testResolver';

// import interfaces
import { IPermissions, IExpressions } from './interfaces';
import { parseGraphQlJsonSchemaToDbObject } from './graphQlSchemaToDbObject';

export namespace graphQl {

  let gQlSchema: any;
  let gQlJsonSchema: any;
  let permissions: IPermissions;
  let expressions: IExpressions;
  let gQlRuntimeSchema: string;
  let gQlRuntimeDocument: any;
  let gQlTypes: any;
  let dbObject: any;

  export const bootGraphQl = async ($one) => {

    const logger = $one.getLogger('bootGraphQl');
    const graphQlConfig = $one.getConfig('fullstackOne').graphql;

    try {

      // load schema
      const gQlSchemaPattern = $one.ENVIRONMENT.path + graphQlConfig.schemaPattern;
      gQlSchema = await gQLHelper.helper.loadFilesByGlobPattern(gQlSchemaPattern);
      // emit event
      $one.getEventEmitter().emit('schema.load.success');

      const gQlSchemaCombined = gQlSchema.join('\n');
      gQlJsonSchema = gQLHelper.helper.parseGraphQlSchema(gQlSchemaCombined);
      // emit event
      $one.getEventEmitter().emit('schema.parsed');

      dbObject = parseGraphQlJsonSchemaToDbObject(gQlJsonSchema);
      // emit event
      $one.getEventEmitter().emit('schema.parsed.to.dbObject');
      // tslint:disable-next-line:no-console
      console.log(JSON.stringify(dbObject, null, 2));

      // load permissions
      const permissionsPattern = $one.ENVIRONMENT.path + graphQlConfig.permissionsPattern;
      const permissionsArray = await gQLHelper.helper.requireFilesByGlobPattern(permissionsPattern);
      permissions = [].concat.apply([], permissionsArray);
      // emit event
      $one.getEventEmitter().emit('permissions.load.success');

      // load expressions
      const expressionsPattern = $one.ENVIRONMENT.path + graphQlConfig.expressionsPattern;
      const expressionsArray = await gQLHelper.helper.requireFilesByGlobPattern(expressionsPattern);
      expressions = [].concat.apply([], expressionsArray);
      // emit event
      $one.getEventEmitter().emit('expressions.load.success');

      const combinedSchemaInformation = runtimeParser(gQlJsonSchema, permissions, expressions);

      gQlRuntimeDocument = combinedSchemaInformation.document;
      gQlRuntimeSchema = gQLHelper.helper.printGraphQlDocument(gQlRuntimeDocument);
      gQlTypes = combinedSchemaInformation.gQlTypes;

      // add endpoints
      addEndpoints($one);

      return dbObject;

    } catch (err) {
      // tslint:disable-next-line:no-console
      console.log(err);
      logger.warn('bootGraphQl.error', err);
      // emit event
      $one.getEventEmitter().emit('bootGraphQl.error', err);
    }

  };

  export const getGraphQlSchema = async () => {
    // return copy insted of ref
    return { ...gQlSchema };
  };

  export const getGraphQlJsonSchema = async () => {
    // return copy insted of ref
    return { ...gQlJsonSchema };
  };

  const addEndpoints = ($one) => {
    const graphQlConfig = $one.getConfig('fullstackOne').graphql;

    const gqlRouter = new KoaRouter();

    const schema = makeExecutableSchema({
			typeDefs: gQlRuntimeSchema,
			resolvers: getResolvers(gQlTypes, dbObject),
		});

    // koaBody is needed just for POST.
    gqlRouter.post('/graphql', koaBody(), graphqlKoa({ schema }));
    gqlRouter.get('/graphql', graphqlKoa({ schema }));

    gqlRouter.get(graphQlConfig.graphiQlEndpoint, graphiqlKoa({ endpointURL: graphQlConfig.endpoint }));

    $one.getApp().use(gqlRouter.routes());
    $one.getApp().use(gqlRouter.allowedMethods());

  };
}

/*
const generatedTestSchema = `

type User_Author @view {
  id: ID! @isUnique
  firstLetterOfUserName: String @computed(expression: "FirstNofField", params: {n: 1})
}

type User_Me @view {
  id: ID! @isUnique
  email: String @isUnique
  username: String
}

type User_Fusion @viewfusion {
  id: ID! @isUnique
  email: String @isUnique
  username: String
  firstLetterOfUserName: String @computed(expression: "FirstNofField", params: {n: 1})
}

union User = User_Author | User_Me | User_Fusion

schema {
  query: RootQuery
}

type RootQuery {
  users(sql: String): [User!]!
}
`;

const testResolvers = {
  RootQuery: {
    users: (obj, args, context, info) => {
      console.log(JSON.stringify(info, null, 2));

      // return [{id:13, firstLetterOfUserName: 'A'}];
      return [{ id: 12, email: 'dustin@fullstack.build', __type: 'User_Me' },{ id:13, firstLetterOfUserName: 'A', __type: 'User_Author' }];
    },
  },
  User_Me: {

  },
  User_Author: {
    // firstLetterOfUserName: () => {
    //  return 'B'
    // }
  },
  User_Fusion: {

  },
  User: {
    __resolveType(obj, context, info) {
      return obj.__type;
      // console.log(obj);

      /*if(obj.firstLetterOfUserName){
        return 'User_Author';
      }
      return 'User_Me';

      if(obj.email && obj.username){
        return 'User_Fusion';
      }

      if(obj.email){
        return 'User_Me';
      }

      return 'User_Fusion';* /
    },
  },
};

*/
