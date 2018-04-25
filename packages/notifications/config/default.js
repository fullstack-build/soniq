module.exports = {
  email: {
    testing: true,
    transport: {
      smtp: {
        host: 'username',
        port: 'password',
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
      expireIn:   '60 min'
    }
  }
};
