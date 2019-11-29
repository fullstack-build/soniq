module.exports = {
  Auth: {
  },
  Server: {
  },
  Events: {
    pgClient: {
      database: process.env.TYPEORM_DATABASE,
      host:     process.env.TYPEORM_HOST,
      user:     process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      port:     process.env.TYPEORM_PORT,
      ssl : process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
    }
  }
};