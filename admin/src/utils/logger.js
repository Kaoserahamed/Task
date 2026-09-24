/**
 * Browser logging façade.
 *
 * The components used to call `console.log` directly — statements that leaked
 * admin tokens and socket payloads into the browser console of a production
 * site and buried real warnings. Every console call in this app now goes
 * through this module, and `no-console` in `.eslintrc.cjs` keeps it that way.
 *
 * `logDebug` / `logWarn` are development-only: a production bundle drops them
 * entirely. `logError` always logs because a genuine failure must stay visible —
 * except under test, where suites deliberately exercise outage paths and would
 * otherwise bury the real failure in expected noise.
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
