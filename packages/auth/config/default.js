module.exports = {
  oAuth: {
    cookie: {
      maxAge:     86400000,
      overwrite:  true,
      httpOnly:   true,
      signed:     true
    },
    providers:        {},
    frontendOrigins:  ["*"],
    serverApiAddress: "http://localhost:3000"
  }
};
