export = {
  logger: {
    minLevel: 'trace',
    dbLogging: false,
    accessLogging: false,
    versioningLogging: false,
  },
  db: {
    automigrate: true,
    renameInsteadOfDrop: true,
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
  },
  queue: {
// leaving this settings out will use a connection from the general pool
//    database: 'fullstack-one-example',
//    host: 'localhost',
//    user: 'postgres',
//    password: 'postgres',
//    poolSize: 1,
    archiveCompletedJobsEvery: '2 days',
    schema: 'pgboss'
  },
  email: {
    testing: true,
    transport: {
      smtp: {
        host: 'username',
        port: 'password',

        // we intentionally do not set any authentication
        // options here as we are going to use message specific
        // credentials

        // Security options to disallow using attachments from file or URL
        disableFileAccess: true,
        disableUrlAccess: true,
        // create a smtp connection pool
        pool: true
      }
    },
    defaults: {

    },
    htmlToText: {},
    queue: {
      retryLimit: 10,
      expireIn: '60 min'
    }
  }
};
