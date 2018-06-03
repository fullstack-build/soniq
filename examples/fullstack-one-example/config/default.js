const FacebookStrategy  = require('passport-facebook');
const GoogleStrategy    = require('passport-google-oauth20');

module.exports = {
  db: {
    appClient: {
      database: process.env.DB_DATABASE,
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    general: {
      database: process.env.DB_DATABASE,
      host:     process.env.DB_HOST,
      user:     process.env.DB_GENERAL_USER,
      password: process.env.DB_GENERAL_PASSWORD
    }
  },
  auth: {
    secrets: {
      jwt:      process.env.AUTH_JWT_SECRET,
      admin:    process.env.AUTH_ADMIN_SECRET,
      provider: process.env.AUTH_PROVIDERS_SECRET,
      cookie:   process.env.AUTH_COOKIE_SECRET,
      jwtRefreshToken:   process.env.AUTH_JWT_REFRESH_TOKEN_SECRET,
      privacyToken:   process.env.AUTH_PRIVACY_TOKEN_SECRET,
      authToken: process.env.AUTH_AUTH_TOKEN_SECRET
    },
    oAuth: {
      providers: {
        facebook: {
          name: 'facebook',
          tenant: 'default',
          strategy: FacebookStrategy,
          config: {
            clientID: 2045088022395430,
            clientSecret: 'ad5b17b47d056393b687c20b64fea2b5',
            profileFields: ['id', 'email']
          }
        },
        google: {
          name: 'google',
          tenant: 'default',
          strategy: GoogleStrategy,
          config: {
            clientID: '24830444193-hoqu3rnqie6078upl25dp6dircdq4c8c.apps.googleusercontent.com',
            clientSecret: '1tf3kDvh2UkNdaF68HA3lS_F',
            profileFields: ['id', 'email']
          }
        }
      },
      frontendOrigins: [
        'http://localhost:3000'
      ],
      serverApiAddress: 'http://localhost:3000'
    }
  },
  server: {
    port: process.env.PORT
  },
  fileStorage: {
    minio: {
      endPoint: 'play.minio.io',
      port: 9000,
      secure: true,
      accessKey: 'Q3AM3UQ867SPQQA43P2F',
      secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
    },
    bucket: 'fullstackonetest'
  },
  schemaBuilder: {
    setUserPrivileges: true
  }
};