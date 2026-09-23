// Root ESLint flat config (ESLint 9).
//
// Each stack owns its own config (`backend/eslint.config.js` and one per React
// app); this file owns the repository-level tooling under `scripts/` only.
// Every other directory is ignored here so the stacks keep a single authority
// each.
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'backend/**',
      'frontend/**',
      'admin/**',
      'tourcompanydashboard/**',
      'recommendations/**',
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
    ],
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    ...js.configs.recommended,
  },
  prettier,
];
