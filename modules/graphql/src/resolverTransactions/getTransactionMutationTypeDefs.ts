const TYPE_DEFS: string = `
extend type Mutation {
  beginTransaction: String!
  commitTransaction: String!
}
`;

export function getTransactionMutationTypeDefs(): string {
  return TYPE_DEFS;
}
