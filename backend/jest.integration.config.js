'use strict';

/**
 * Integration test configuration.
 *
 * These specs exercise the real routers, the real controllers and the real
 * Mongoose queries against a throwaway MongoDB started by
 * `mongodb-memory-server`. They are deliberately kept out of `npm test`:
 * downloading the mongod binary is slow and needs network access on the first
 * run, which would make the default gate neither fast nor hermetic.
 *
 * Run them with:
 *   npm run test:integration                    # in-memory MongoDB
 *   MONGODB_URI=mongodb://localhost:27017/... npm run test:integration   # any Mongo
 */

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/tests/unit/setup-env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
  testTimeout: 120000,
  runInBand: true,
};
