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
    },
    orm: {
      connection: {
        "type": "postgres",
        "host": "localhost",
        "port": 5432,
        "username": "ormuser",
        "password": "orm",
        "database": "OrmTest",
        "synchronize": true,
        "logging": true,
        "entities": ["/models/*.ts"],
        // "migrations": ["/migration/**/*.ts"],
        "cli": {
          "migrationsDir": "migration"
        }
      },
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