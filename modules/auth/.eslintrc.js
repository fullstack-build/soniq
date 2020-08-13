require("@soniq/eslint-config");

module.exports = {
  overrides: [
    {
      // allow PostgreSQL naming convention "snake_case"
      "files": ["src/interfaces.ts", "src/migration/defaultConfig.ts"],
      rules: {
        "@typescript-eslint/naming-convention": ["error", {
          selector: 'variable',
          format: ['snake_case', 'camelCase', 'UPPER_CASE', 'PascalCase']
        }]
      }
    }
  ],
  extends: ["@soniq/eslint-config"]
};
