/**
 * ESLint config for the admin dashboard (Create React App).
 *
 * See frontend/.eslintrc.cjs for the rationale: CRA 5 pins ESLint 8 and
 * `react-app` is the same rule set the production build enforces.
 *
 * The `react-app` config omits the `jest`/`node` environments, which left
 * globals such as `globalThis` (ES2020) raised as undefined in test files.
 * We merge those environments here so existing tests lint cleanly.
 */
module.exports = {
  root: true,
  extends: ['react-app', 'react-app/jest', 'prettier'],
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  rules: {
    // C2.5: all logging goes through `src/utils/logger.js` so admin payloads
    // (company records, support chats) never reach a user's console. The
    // override is the only sanctioned place a raw console call may live.
    'no-console': 'error',
  },
  overrides: [
    {
      files: ['src/utils/logger.js'],
      rules: { 'no-console': 'off' },
    },
  ],
  ignorePatterns: ['build/', 'node_modules/', 'coverage/'],
};
