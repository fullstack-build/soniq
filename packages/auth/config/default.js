module.exports = {
  auth: {
    secrets: {
      jwt:      null,
      admin:    null,
      provider: null,
      cookie:   null,
      jwtRefreshToken: null,
      privacyToken: null,
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
      headerName: 'X-Auth-Token',
      maxAgeInSeconds: 60
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
    metaHeaderName: 'X-Registration-Meta',
    privacy: {
      tokenMaxAgeInSeconds: 86400, // One Day
      versionToApprove: 0,
      active: true,
      acceptedAtField: 'acceptedPrivacyTermsAt',
      acceptedVersionField: 'acceptedPrivacyTermsVersion',
      headerName: 'X-Privacy-Token'
    }
  }
};
