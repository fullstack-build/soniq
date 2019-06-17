module.exports = {
  Auth: {
    secrets: {
      jwt: process.env.AUTH_JWT_SECRET,
      admin: process.env.AUTH_ADMIN_SECRET,
      provider: process.env.AUTH_PROVIDERS_SECRET,
      cookie: process.env.AUTH_COOKIE_SECRET,
      jwtRefreshToken: process.env.AUTH_JWT_REFRESH_TOKEN_SECRET,
      privacyAgreementAcceptanceToken: process.env.AUTH_PRIVACY_TOKEN_SECRET,
      authToken: process.env.AUTH_AUTH_TOKEN_SECRET,
      authProviderHashSignature: "test1234",
      encryptionKey: "qcJVt6ASy9Ew2nRV5ZbhZEzAahn8fwjL"
    },
    corsOptions: {
      allowMethods: ["GET", "POST"],
      credentials: true
    },
    validOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
  },
  Db: {
    appClient: {
      database: process.env.TYPEORM_DATABASE,
      host:     process.env.TYPEORM_HOST,
      user:     process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      port:     process.env.TYPEORM_PORT
    },
    general: {
      database: process.env.TYPEORM_DATABASE,
      host:     process.env.TYPEORM_HOST,
      user:     process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      port:     process.env.TYPEORM_PORT,
      totalMax: 20
    },
    orm: {
      connection: {
        type:         process.env.TYPEORM_CONNECTION,
        host:         process.env.TYPEORM_HOST,
        port:         process.env.TYPEORM_PORT,
        username:     process.env.TYPEORM_USERNAME,
        password:     process.env.TYPEORM_PASSWORD,
        database:     process.env.TYPEORM_DATABASE,
        synchronize:  process.env.TYPEORM_SYNCHRONIZE === "true",
        logging:      process.env.TYPEORM_LOGGING === "true",
        entities: ["/models/*.ts"]
      },
      pool: {
        "min":                      3,
        "max":                      5,
        "globalMax":                100,
        "updateClientListInterval": 10 * 1000
      }
    }
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
      port:     process.env.TYPEORM_PORT
    }
  },
  SchemaBuilder: {
    setUserPrivileges: true
  }
};