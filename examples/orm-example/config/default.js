module.exports = {
  Db: {
    appClient: {
      database: process.env.DB_DATABASE,
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port:     process.env.DB_PORT
    },
    general: {
      database: process.env.DB_DATABASE,
      host:     process.env.DB_HOST,
      user:     process.env.DB_GENERAL_USER,
      password: process.env.DB_GENERAL_PASSWORD,
      port:     process.env.DB_PORT,
      totalMax: 20
    }
  },
  Server: {
    port: process.env.PORT
  },
  Events: {
    pgClient: {
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    }
  },
  SchemaBuilder: {
    setUserPrivileges: true
  }
};