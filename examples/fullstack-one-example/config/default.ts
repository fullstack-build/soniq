export = {
  logger: {
    minLevel: 'trace',
    dbLogging: false,
    accessLogging: false,
    versioningLogging: false,
  },
  db: {
    setup: {
      database: 'fullstack-one-example',
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3211,
    },
    general: {
      user: 'dbuser',
      host: 'database.server.com',
      database: 'mydb',
      password: 'secretpassword',
      port: 3211,
      ssl: true,
      // set pool max size to 20
      max: 20,
      // set min pool size to 4
      min: 4,
      // close idle clients after 1 second
      idleTimeoutMillis: 1000,
      // return an error after 1 second if connection could not be established
      connectionTimeoutMillis: 1000,
    },
  },
};
