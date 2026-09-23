'use strict';

const { ForbiddenError } = require('../utils/errors');

/**
 * CORS policy.
 *
 * The previous configuration accepted *any* origin that merely contained
 * "vercel.app" or "localhost", which means `evil-vercel.app.attacker.com` was
 * allowed to call the API with the user's cookies. The policy is now an exact
 * match against an explicit allow-list:
 *
 *   - `FRONTEND_URL`, `ADMIN_URL`, `COMPANY_URL` and `CORS_EXTRA_ORIGINS`
 *     (comma separated) supply the deployed origins;
 *   - loopback origins are allowed in development and test only, so running the
 *     React apps on an arbitrary port keeps working locally;
 *   - requests without an Origin header (curl, mobile apps, server-to-server)
 *     are allowed — CORS is a browser control, there is nothing to check.
 */

const LOOPBACK_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function parseOriginList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function buildAllowedOrigins({ nodeEnv = 'development', env = process.env } = {}) {
  const configured = [
    ...parseOriginList(env.FRONTEND_URL),
    ...parseOriginList(env.ADMIN_URL),
    ...parseOriginList(env.COMPANY_URL),
    ...parseOriginList(env.CORS_EXTRA_ORIGINS),
  ];

  // Local development keeps its convenience: any loopback port is trusted.
  if (nodeEnv !== 'production') {
    configured.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }

  return [...new Set(configured)];
}

/**
 * Build the `origin` callback handed to the cors middleware *and* to Socket.IO,
 * so HTTP and WebSocket traffic share one policy.
 */
function createOriginValidator({ nodeEnv = 'development', allowedOrigins } = {}) {
  const allowList = allowedOrigins || buildAllowedOrigins({ nodeEnv });

  return function validateOrigin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowList.includes(origin)) {
      return callback(null, true);
    }
    if (nodeEnv !== 'production' && LOOPBACK_PATTERN.test(origin)) {
      return callback(null, true);
    }
    return callback(new ForbiddenError(`Origin ${origin} is not allowed by CORS`, 'CORS_BLOCKED'));
  };
}

function createCorsOptions(options = {}) {
  const nodeEnv = options.nodeEnv || process.env.NODE_ENV || 'development';

  return {
    origin: createOriginValidator({ ...options, nodeEnv }),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  };
}

module.exports = { parseOriginList, buildAllowedOrigins, createOriginValidator, createCorsOptions };
