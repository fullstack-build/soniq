
import { ApolloError } from 'apollo-server';

export default async (obj, args, context, info, params, f1) => {
  throw new ApolloError('MyMSG', 'USERINPUTERROR', {bla: 7, huhu: ['a','b','c']});
  return {
    sum: args.a + args.b
  };
};
