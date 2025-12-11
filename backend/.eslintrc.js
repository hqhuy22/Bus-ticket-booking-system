// Suppress typescript-estree version check warning when TypeScript is newer than
// the parser's supported range in some environments.
process.env.TSESTREE_DISABLE_VERSION_CHECK = 'true';

// Suppress typescript-estree version check when using newer TypeScript in some environments
// This reduces a noisy warning; the parser will still function.
process.env.TSESTREE_DISABLE_VERSION_CHECK = 'true';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
