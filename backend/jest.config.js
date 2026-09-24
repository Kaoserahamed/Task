'use strict';

/**
 * Backend test configuration — hermetic unit suite.
 *
 * `npm test` must be green on a fresh clone with no database, no Docker and no
 * network access. That is why this config only picks up `tests/unit`: nothing
 * there touches MongoDB (the repository layer is stubbed in-memory), so the run
 * takes seconds and can be trusted as a fast, always-on gate.
 *
 * The integration suite — the same HTTP surface against a real MongoDB — lives
 * in `tests/integration` and runs through `npm run test:integration`
 * (jest.integration.config.js).
 */

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/tests/unit/setup-env.js'],
  testTimeout: 15000,
  clearMocks: true,
  restoreMocks: true,

  // Coverage is collected from application source only: the entry point starts a
  // real server (exercised by the integration suite) and the test helpers are
  // not production code.
  collectCoverageFrom: [
    'config/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    'repositories/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'validators/**/*.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text-summary', 'json-summary', 'lcov', 'clover'],

  // Keep the Jest floor visible in the config as well as in the per-area checker.
  // These values match the current measured baseline and the custom floors below.
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 55,
      lines: 60,
      statements: 60,
    },
  },
};
