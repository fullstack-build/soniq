// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("./common/temp/node_modules/@rushstack/eslint-config/patch-eslint6");

module.exports = {
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    "eqeqeq": [2, "smart"]
  },
  extends: ["./common/temp/node_modules/@rushstack/eslint-config", "plugin:prettier/recommended"],
  "ignorePatterns": ["node_modules/", "dist/", "tests", "*.test.ts", "_v1", "_v1_mig3"],
  env: {
    node: true
  }
};