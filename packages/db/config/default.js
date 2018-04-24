module.exports = {
  db: {
    automigrate: true,
    renameInsteadOfDrop: true,
    viewSchemaName: 'graphql',
    updateClientListInterval: 10000,
    appClient: {
      database: 'fullstack-one-example',
      host: 'localhost',
      user: 'postgres',
      password: 'postgres',
      port: 5432,
      ssl: false,
    },
    general: {
      database: 'fullstack-one-example',
      host: 'localhost',
      user: 'postgres',
      password: 'postgres',
      port: 5432,
      ssl: false,
      // set pool max size to 20 (among all instances)
      totalMax: 20,
      // set min pool size to 4
      min: 4,
      // close idle clients after 1 second
      idleTimeoutMillis: 1000,
      // return an error after 1 second if connection could not be established
      connectionTimeoutMillis: 1000,
    },
  }
};