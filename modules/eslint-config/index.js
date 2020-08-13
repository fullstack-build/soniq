// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("@rushstack/eslint-config/patch/modern-module-resolution");

const prettierConfig = require("./prettier.config");

module.exports = {
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": ["error", prettierConfig],
    eqeqeq: [2, "smart"],
    "@rushstack/no-null": [0],
    // "@typescript-eslint/typedef": [2, {variableDeclaration: false}]
  },
  extends: ["@rushstack/eslint-config", "plugin:prettier/recommended"],
  ignorePatterns: ["node_modules/", "dist/", "tests", "*.test.ts", "_v1", "_v1_mig3"],
  env: {
    node: true,
  },
};
