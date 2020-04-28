const TYPE_DEFS = `
extend type Mutation {
  beginTransaction: String!
  commitTransaction: String!
}
`;

export function getTransactionMutationTypeDefs() {
  return TYPE_DEFS;
}
