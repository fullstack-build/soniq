module.exports = {
  email: {
    testing: true,
    transport: {
      smtp: {
        host: 'host',
        port: 'port',
        secure: true,
        auth: {
          user: 'username',
          pass: 'pass'
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
      retryBackoff: true,
      retryDelay: 1,
      expireIn:   '60 min'
    }
  }
};
