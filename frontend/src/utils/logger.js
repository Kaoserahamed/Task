/**
 * Browser logging façade.
 *
 * The components used to call `console.log` directly — 71 statements across 15
 * files, most of them left-over debugging ("its happening", token dumps, socket
 * payloads). That noise ships to end users, leaks chat/user payloads into the
 * browser console of a production site, and makes real warnings impossible to
 * spot. Every console call in this app now goes through this module, and
 * `no-console` in `.eslintrc.cjs` keeps it that way.
 *
 * `logDebug` / `logWarn` are development-only: a production bundle drops them
 * entirely, so debug leftovers cost users nothing. `logError` always logs
 * because a genuine failure must stay visible — except under test, where the
 * suites deliberately exercise outage paths and would otherwise bury the real
 * failure in expected noise.
 */
const isDevelopment = () => process.env.NODE_ENV !== 'production';
const isTest = () => process.env.NODE_ENV === 'test';

const logDebug = (...args) => {
  if (isDevelopment() && !isTest()) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

const logWarn = (...args) => {
  if (isDevelopment() && !isTest()) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
};

const logError = (...args) => {
  if (isTest()) {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(...args);
};

export { logDebug, logWarn, logError };
