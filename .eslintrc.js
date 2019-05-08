module.exports =  {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-typescript/base',
  ],
 parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off'
  },
};