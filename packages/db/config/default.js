module.exports = {
  automigrate:                false,
  renameInsteadOfDrop:        true,
  viewSchemaName:             '_graphql',
  updateClientListInterval:   10000,
  appClient: {
    database:                 null,
    host:                     null,
    user:                     null,
    password:                 null,
    port:                     5432,
    ssl:                      false,
  },
  general: {
    database:                 null,
    host:                     null,
    user:                     null,
    password:                 null,
    port:                     5432,
    ssl:                      false,
    // set pool max size to 20 (among all instances)
    totalMax:                 10,
    // set min pool size to 4
    min:                      2,
    // close idle clients after 30 seconds
    idleTimeoutMillis:        30000,
    // return an error after 3 seconds if connection could not be established
    connectionTimeoutMillis:  3000,
  }
};