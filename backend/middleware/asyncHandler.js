'use strict';

/**
 * Wrap an async route handler so a rejected promise reaches the error handler.
 *
 * Express 4 only catches synchronous throws; an `await` that rejects would
 * otherwise become an unhandled rejection and the client would hang until the
 * socket times out. Wrapping every async handler in this helper is what lets
 * controllers drop their `try/catch` blocks and simply throw.
 *
 * Usage:
 *   router.get('/thing', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
