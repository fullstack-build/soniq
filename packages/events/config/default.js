module.exports = {
  eventEmitter: {
    delimiter: ".",
    newListener: false,
    maxListeners: 1000,
    verboseMemoryLeak: true
  },
  pgClient: {
    database: null,
    host: null,
    user: null,
    password: null,
    port: 5432,
    ssl: false
  }
};
