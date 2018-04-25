module.exports = {
  auth: {
    secrets: {
      jwt:      null,
      admin:    null,
      provider: null,
      cookie:   null,
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
    cookie: {
      name:       'access_token',
      maxAge:     86400000,
      overwrite:  true,
      httpOnly:   true,
      signed:     true
    },
    tokenQueryParameter:          'access_token',
    enableDefaultLocalStrategie:  true
  }
};
