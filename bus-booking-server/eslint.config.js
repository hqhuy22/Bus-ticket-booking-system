import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules', 'coverage', 'dist', 'uploads'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in Node.js
      'prettier/prettier': 'warn',
    },
  },
  // Test files configuration
  {
    files: ['__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': 'off', // More lenient in tests
    },
  },
];
