'use strict';

const { verifyAccessToken } = require('../utils/token');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Require a valid access token.
 *
 * The middleware used to `logger.info(token)` on every request, which wrote
 * every user's live JWT into the log file — the exact value an attacker needs.
 * Only the outcome is logged now, never the credential itself. Verification also
 * goes through utils/token.js, so the secret and lifetime have a single owner.
 *
 * Failures throw the typed error instead of writing a response by hand, so the
 * envelope matches every other endpoint.
 */
function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('No token, authorization denied', 'NO_TOKEN'));
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    logger.warn('Token verification failed');
    return next(new UnauthorizedError('Token is not valid', 'INVALID_TOKEN'));
  }
}

module.exports = authMiddleware;
