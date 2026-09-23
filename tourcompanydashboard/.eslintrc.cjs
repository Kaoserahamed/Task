/**
 * ESLint config for the tour-company dashboard (Create React App).
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
  ignorePatterns: ['build/', 'node_modules/', 'coverage/'],
};
