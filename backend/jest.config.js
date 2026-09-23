module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Collect coverage from application source only — not the entry point
  // (index.js starts the real server and is exercised via integration)
  // or the test setup helpers.
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'models/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
  ],

  // Coverage gate strategy:
  //  - `global` is a live floor. It sits just below the current measured
  //    coverage so the gate is green today but a real regression (e.g. the
  //    entire test suite being removed) still fails the build.
  //
  // Coverage baseline (backend/tests, real numbers):
  //   All files | 8.24 stmts | 12.23 branch | 10.92 funcs | 8.47 lines
  //   controllers/tour.js | 27.0 stmts | 14.1 branch | 22.7 funcs | 27.4 lines
  //   middleware/validate.js | 80.5 | 83.0 | 75.0 | 80.5
  //   models/tours.js | 100 | 100 | 100 | 100
  //
  // Ratchet these numbers upward as new areas come under test; never disable.
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
};
