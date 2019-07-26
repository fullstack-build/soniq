module.exports = {
  Db: {
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    entities: ["/models/*.ts"],
    synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
    logging: process.env.TYPEORM_LOGGING === "true",
    min: 3,
    max: 5,
    globalMax: 100,
    updateClientListInterval: 10 * 1000,
    ssl: process.env.DB_SSL === "true"
  },
  Server: {
    port: process.env.PORT
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