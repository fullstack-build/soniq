export default ({projectDir}) => {
  return {
      "verbose": true,
      "files": [
        "tests/*.test.ts"
      ],
      "extensions": [
        "ts"
      ],
      "require": [
        "ts-node/register"
      ]
    };
};