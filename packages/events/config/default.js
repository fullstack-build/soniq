module.exports = {
  namespace: "one",
  eventEmitter: {
    wildcard: true,
    delimiter: ".",
    newListener: false,
    maxListeners: 1000,
    verboseMemoryLeak: true
  }
};
