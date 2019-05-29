module.exports = {
  automigrate:                false,
  renameInsteadOfDrop:        true,
  viewSchemaName:             "_graphql",
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
    globalMax:                 20,
    // set min pool size to 4
    min:                      2,
    updateClientListInterval: 10 * 1000
    // close idle clients after 30 seconds
    // idleTimeoutMillis:        30000, => REMOVED BECAUSE OPTIONAL
    // return an error after 3 seconds if connection could not be established
    // connectionTimeoutMillis:  3000, => REMOVED BECAUSE OPTIONAL
  }
};