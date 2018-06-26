module.exports = {
  auth: {
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
      allowMethods: ['GET', 'POST']
    },
    privacyAgreementAcceptance: {
      tokenMaxAgeInSeconds: 86400, // One Day
      versionToAccept: 0,
      queryParameter: 'privacyAgreementAcceptanceToken'
    }
  }
};
