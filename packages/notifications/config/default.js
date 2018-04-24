module.exports = {
  email: {
    testing: true,
    transport: {
      smtp: {
        host: 'username',
        port: 'password',

        // we intentionally do not set any authentication
        // options here as we are going to use message specific
        // credentials

        // Security options to disallow using attachments from file or URL
        disableFileAccess: true,
        disableUrlAccess: true,
        // create a smtp connection pool
        pool: true
      }
    },
    defaults: {

    },
    htmlToText: {},
    queue: {
      retryLimit: 10,
      expireIn: '60 min'
    }
  }
};
