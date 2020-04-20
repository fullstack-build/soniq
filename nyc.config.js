module.exports = {
  "include": [ "index.ts", "src/**/*.ts"],
  "exclude": [ "src/**/*.d.ts" ],
  "extension": [ ".ts" ],
  "require": [ "ts-node/register" ],
  "reporter": ["text", "html" ],
  "sourceMap": true,
  "instrument": true
};