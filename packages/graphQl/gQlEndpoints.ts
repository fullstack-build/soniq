/***
import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';
import * as koaBody from 'koa-bodyparser';
import * as KoaRouter from 'koa-router';

export const graphQlEndpoints = ($One) => {

  const gqlRouter = new KoaRouter();

  const schema = makeExecutableSchema({
    typeDefs: generatedTestSchema,
    resolvers: testResolvers,
  });

  // koaBody is needed just for POST.
  gqlRouter.post('/graphql', koaBody(), graphqlKoa({ schema }));
  gqlRouter.get('/graphql', graphqlKoa({ schema }));

  gqlRouter.get('/graphiql', graphiqlKoa({ endpointURL: '/graphql' }));

  $One.getApp().use(gqlRouter.routes());
  $One.getApp().use(gqlRouter.allowedMethods());

};

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
