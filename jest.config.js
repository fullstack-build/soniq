module.exports = {
  "verbose": true,
  "preset": "ts-jest",
  "testEnvironment": "node",
  "collectCoverage": true,
  "testMatch": ["/**/*.test.ts"],
  "globals": {
    "ts-jest": {
      "packageJson": "package.json"
    }
  }
};