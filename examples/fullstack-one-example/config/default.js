const FacebookStrategy  = require('passport-facebook');
const GoogleStrategy    = require('passport-google-oauth20');

module.exports = {
  db: {
  },
  auth: {
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
  }
};