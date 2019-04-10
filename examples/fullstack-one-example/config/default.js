const FacebookStrategy  = require("passport-facebook");
const GoogleStrategy    = require("passport-google-oauth20");

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
      port:     process.env.DB_PORT
    }
  },
  Auth: {
    secrets: {
      jwt:      process.env.AUTH_JWT_SECRET,
      admin:    process.env.AUTH_ADMIN_SECRET,
      provider: process.env.AUTH_PROVIDERS_SECRET,
      cookie:   process.env.AUTH_COOKIE_SECRET,
      jwtRefreshToken:   process.env.AUTH_JWT_REFRESH_TOKEN_SECRET,
      privacyAgreementAcceptanceToken:   process.env.AUTH_PRIVACY_TOKEN_SECRET,
      authToken: process.env.AUTH_AUTH_TOKEN_SECRET,
      authProviderHashSignature: 'test1234',
      encryptionKey: 'qcJVt6ASy9Ew2nRV5ZbhZEzAahn8fwjL'
    },
    oAuth: {
      providers: {
        facebook: {
          name: "facebook",
          tenant: "default",
          strategy: FacebookStrategy,
          config: {
            clientID: 2045088022395430,
            clientSecret: "ad5b17b47d056393b687c20b64fea2b5",
            profileFields: ["id", "email"]
          }
        },
        google: {
          name: "google",
          tenant: "default",
          strategy: GoogleStrategy,
          config: {
            clientID: "24830444193-hoqu3rnqie6078upl25dp6dircdq4c8c.apps.googleusercontent.com",
            clientSecret: "1tf3kDvh2UkNdaF68HA3lS_F",
            profileFields: ["id", "email"]
          }
        }
      },
      frontendOrigins: [
        "http://localhost:3000"
      ],
      serverApiAddress: "http://localhost:3000"
    }
  },
  AuthFbToken: {
    clientID: 2045088022395430,
    clientSecret: "ad5b17b47d056393b687c20b64fea2b5"
  },
  Server: {
    port: process.env.PORT
  },
  FileStorage: {
    minio: {
      endPoint: "play.minio.io",
      port: 9000,
      useSSL: true,
      accessKey: "Q3AM3UQ867SPQQA43P2F",
      secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
    },
    bucket: "fullstackonetest"
  },
  SchemaBuilder: {
    setUserPrivileges: true
  },
  Queue: {
    // leaving this settings out will use a connection from the general pool
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    user: process.env.DB_QUEUE_USER,
    password: process.env.DB_QUEUE_PASSWORD,
    port: process.env.DB_PORT,
    poolSize: 1,
    archiveCompletedJobsEvery: "2 days",
    //schema: "_queue"
  },
  Notifications: {
    Email: {
      testing: false,
      transport: {
        smtp: {
          host: process.env.EMAIL_HOST,
          port: (process.env.EMAIL_PORT != null) ? parseInt(process.env.EMAIL_PORT, 10) : null,
          secure: process.env.EMAIL_SECURE != null && process.env.EMAIL_SECURE.toLowerCase() === "true",
          auth: {
            user:  process.env.EMAIL_AUTH_USERNAME,
            pass:  process.env.EMAIL_AUTH_PASSWORD
          },
          // Security options to disallow using attachments from file or URL
          disableFileAccess: true,
          disableUrlAccess: true,
          // create a smtp connection pool
          pool: true
        }
      },
      defaults: {},
      htmlToText: {},
      queue: {
        retryLimit: 10,
        expireIn:   "60 min"
      }
    }
  }
};