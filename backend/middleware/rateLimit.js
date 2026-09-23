'use strict';

const rateLimit = require('express-rate-limit');
const { TooManyRequestsError } = require('../utils/errors');

/**
 * Rate limiting.
 *
 * Credential endpoints are brute-force targets: without a limit an attacker can
 * try passwords as fast as the network allows. The factory is exported so the
 * windows can be exercised in unit tests and tuned per environment.
 */

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function createRateLimiter({
  windowMs = FIFTEEN_MINUTES,
  max = 300,
  message = 'Too many requests, please try again later',
} = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Reuse the error taxonomy: the limiter responds through the central
    // error handler, so a 429 body matches every other failure shape.
    handler: (req, res, next) => next(new TooManyRequestsError(message)),
  });
}

/** Login / registration / password-reset traffic. */
const authLimiter = createRateLimiter({
  max: 30,
  message: 'Too many authentication attempts, please try again in a few minutes',
});

/** Everything under /api — generous, it only exists to absorb runaway clients. */
const apiLimiter = createRateLimiter({ max: 600 });

/** Uploads are expensive (disk or Cloudinary quota). */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 120,
  message: 'Upload limit reached, please try again later',
});

module.exports = { createRateLimiter, authLimiter, apiLimiter, uploadLimiter, FIFTEEN_MINUTES };
