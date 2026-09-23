'use strict';

/**
 * ESLint flat config for the API (ESLint 9).
 *
 * `eslint-config-prettier` is applied last so the linter never fights the
 * formatter: ESLint owns correctness rules, Prettier owns layout (see
 * `.prettierrc.json` and `npm run format`).
 *
 * Rules are deliberately a small superset of the ESLint recommended set - the
 * goal is a fast, always-green gate in CI, not a style war.
 */

const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'uploads/**', 'public/uploads/**', '*.log'],
  },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Logging goes through utils/logger.js in application code, but console
      // stays allowed for scripts/ and one-off diagnostics rather than being
      // flagged as an error.
      'no-console': 'off',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': ['error', 'properties'],
      curly: ['error', 'multi-line'],
      'no-return-await': 'error',
    },
  },

  {
    // Tests may import helpers they only use conditionally.
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // Must stay last: turns off rules that would conflict with Prettier.
  prettier,
];
