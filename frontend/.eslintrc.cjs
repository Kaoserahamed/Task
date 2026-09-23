/**
 * ESLint config for the customer front-end (Create React App).
 *
 * CRA 5 ships ESLint 8 through react-scripts, so this stack keeps the legacy
 * config format; `eslint-config-react-app` is the same rule set the production
 * build already enforces, which keeps `npm run lint` and `npm run build` in
 * agreement. `eslint-config-prettier` stays last so the linter never fights
 * the formatter.
 *
 * Migration note: CRA is deprecated upstream. When this app moves to Vite the
 * config becomes the ESLint 9 flat format used by `backend/`.
 *
 * The `react-app` shareable config intentionally omits the `jest`/`node`
 * environments (CRA runs its own lint over test files), which left globals such
 * as `globalThis` (ES2020) raised as undefined in `setupTests.js`. We merge
 * those environments here so the existing test files lint cleanly.
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
