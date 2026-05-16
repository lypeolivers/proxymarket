const path = require('path');

module.exports = {
  root: true,
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: ['airbnb-typescript/base', 'prettier', 'plugin:@typescript-eslint/recommended', 'plugin:import/typescript'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.eslint.json'),
    tsconfigRootDir: __dirname,
  },
  rules: {
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    '@typescript-eslint/lines-between-class-members': 'off',
    'import/no-extraneous-dependencies': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-use-before-define': 'warn',
    '@typescript-eslint/no-loop-func': 'warn',
    '@typescript-eslint/naming-convention': 'warn',
    '@typescript-eslint/no-shadow': 'warn',
  },
  overrides: [
    {
      files: ['src/test/**/*.ts'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      // Fastify route files require `app as any` to bypass generic type mismatch
      // between typed controller handlers and Fastify's RouteGenericInterface.
      files: ['src/modules/*/routes/routes.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
