module.exports = {
  secrets: {
    jwt:      null,
    admin:    null,
    provider: null,
    cookie:   null,
    jwtRefreshToken: null,
    privacyAgreementAcceptanceToken: null,
    authToken: null
  },
  sodium: {},
  oAuth: {
    cookie: {
      maxAge:     86400000,
      overwrite:  true,
      httpOnly:   true,
      signed:     true
    },
    providers:        {},
    frontendOrigins:  ['*'],
    serverApiAddress: 'http://localhost:3000'
  },
  authToken: {
    maxAgeInSeconds: 86400 // Should be changed to one minute on production
  },
  cookie: {
    name:       'access_token',
    maxAge:     86400000,
    overwrite:  true,
    httpOnly:   true,
    signed:     true
  },
  tokenQueryParameter:          'access_token',
  enableDefaultLocalStrategie:  true,
  validOrigins: [
    'http://localhost:3000'
  ],
  isServerBehindProxy: true,
  enforceHttpsOnProduction: true,
  allowAllCorsOriginsOnDev: true,
  apiClientOrigin: '#?API_CLIENT',
  corsOptions: {
    allowMethods: ['GET', 'POST'],
    credentials: true,
    /**
     * Added maxAge because of this: https://stackoverflow.com/a/29954326/4102308
     * Chose 60 because it is default here: https://www.owasp.org/index.php/CORS_RequestPreflighScrutiny
     */
    maxAge: 60
  },
  privacyAgreementAcceptance: {
    tokenMaxAgeInSeconds: 86400, // One Day
    versionToAccept: 0,
    queryParameter: 'privacyAgreementAcceptanceToken'
  }
};
