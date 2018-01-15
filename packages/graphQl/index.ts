import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';
import * as koaBody from 'koa-bodyparser';
import * as KoaRouter from 'koa-router';

// fullstack-one core
import { helper } from '../core';

// import sub modules
import { graphQl as gQLHelper } from './helper';
export * from '../migration/migration';

import { runtimeParser } from './parser';
import { getResolvers } from './queryBuilder/resolvers';

// import interfaces
import { IViews, IExpressions } from './interfaces';
import { parseGraphQlJsonSchemaToDbObject } from './graphQlSchemaToDbObject';

export namespace graphQl {

  let gQlSchema: any;
  let gQlJsonSchema: any;
  let views: IViews;
  let expressions: IExpressions;
  let gQlRuntimeSchema: string;
  let gQlRuntimeDocument: any;
  let gQlTypes: any;
  let dbObject: any;
  let mutations: any;
  let queries: any;
  let customOperations: any;

  export const bootGraphQl = async ($one) => {

    const logger = $one.getLogger('bootGraphQl');
    const graphQlConfig = $one.getConfig('graphql');

    try {

      // load schema
      const gQlSchemaPattern = $one.ENVIRONMENT.path + graphQlConfig.schemaPattern;
      gQlSchema = await helper.loadFilesByGlobPattern(gQlSchemaPattern);
      // emit event
      $one.getEventEmitter().emit(`${$one.ENVIRONMENT.namespace}.graphQl.schema.load.success`);

      const gQlSchemaCombined = gQlSchema.join('\n');
      gQlJsonSchema = gQLHelper.helper.parseGraphQlSchema(gQlSchemaCombined);
      // emit event
      $one.getEventEmitter().emit(`${$one.ENVIRONMENT.namespace}.graphQl.schema.parsed`);

      dbObject = parseGraphQlJsonSchemaToDbObject(gQlJsonSchema);
      // emit event
      $one.getEventEmitter().emit(`${$one.ENVIRONMENT.namespace}.graphQl.schema.parsed.to.dbObject`);

      // load permissions
      const viewsPattern = $one.ENVIRONMENT.path + graphQlConfig.viewsPattern;
      const viewsArray = await helper.requireFilesByGlobPattern(viewsPattern);
      views = [].concat.apply([], viewsArray);
      // emit event
      $one.getEventEmitter().emit(`${$one.ENVIRONMENT.namespace}.graphQl.permissions.load.success`);

      // load expressions
      const expressionsPattern = $one.ENVIRONMENT.path + graphQlConfig.expressionsPattern;
      const expressionsArray = await helper.requireFilesByGlobPattern(expressionsPattern);
      expressions = [].concat.apply([], expressionsArray);
      // emit event
      $one.getEventEmitter().emit(`${$one.ENVIRONMENT.namespace}.graphQl.expressions.load.success`);

      const combinedSchemaInformation = runtimeParser(gQlJsonSchema, views, expressions, dbObject, $one);

      gQlRuntimeDocument = combinedSchemaInformation.document;
      gQlRuntimeSchema = gQLHelper.helper.printGraphQlDocument(gQlRuntimeDocument);
      gQlTypes = combinedSchemaInformation.gQlTypes;
      queries = combinedSchemaInformation.queries;
      mutations = combinedSchemaInformation.mutations;

      customOperations = {
        fields: combinedSchemaInformation.customFields,
        queries: combinedSchemaInformation.customQueries,
        mutations: combinedSchemaInformation.customMutations
      };

      Object.values(combinedSchemaInformation.dbViews).forEach((dbView) => {
        if (dbObject.schemas[dbView.viewSchemaName] == null) {
          dbObject.schemas[dbView.viewSchemaName] = {
            tables: {},
            views: {}
          };
        }
        dbObject.schemas[dbView.viewSchemaName].views[dbView.viewName] = dbView;
      });
      // dbObject.views = combinedSchemaInformation.views;

      // add endpoints
      await addEndpoints($one);

      return dbObject;

    } catch (err) {
      // tslint:disable-next-line:no-console
      console.log('ERR', err);

      logger.warn('bootGraphQl.error', err);
      // emit event
      $one.getEventEmitter().emit(`${$one.ENVIRONMENT.namespace}.graphQl.bootGraphQl.error`, err);
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

  const addEndpoints = async ($one) => {
    const graphQlConfig = $one.getConfig('graphql');

    const gqlRouter = new KoaRouter();

    // Load resolvers
    const resolversPattern = $one.ENVIRONMENT.path + graphQlConfig.resolversPattern;
    const resolversObject = await helper.requireFilesByGlobPatternAsObject(resolversPattern);

    const schema = makeExecutableSchema({
			typeDefs: gQlRuntimeSchema,
			resolvers: getResolvers(gQlTypes, dbObject, queries, mutations, customOperations, resolversObject),
		});

    const setCacheHeaders = async (ctx, next) => {
      await next();
      let cacheHeader = 'no-store';
      // console.log(ctx.response.body, ctx.response.body != null , typeof ctx.response.body);
      // || (ctx.body != null && ctx.body.errors != null && ctx.body.errors.length > 0)
      if (ctx.state.includesMutation === true) {
        cacheHeader = 'no-store';
      } else {
        if (ctx.state.authRequired === true) {
          cacheHeader = 'privat, max-age=600';
        } else {
          cacheHeader = 'public, max-age=600';
        }
      }

      ctx.set('Cache-Control', cacheHeader);
    };

    const gQlParam = (ctx) => {
      ctx.state.authRequired = false;
      ctx.state.includesMutation = false;

      return {
        schema,
        context: {
          ctx,
          accessToken: ctx.state.accessToken
        }
      };
    };

    // koaBody is needed just for POST.
    gqlRouter.post('/graphql', koaBody(), setCacheHeaders, graphqlKoa(gQlParam));
    gqlRouter.get('/graphql', setCacheHeaders, graphqlKoa(gQlParam));

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
