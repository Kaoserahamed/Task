'use strict';

/**
 * Structured logging.
 *
 * The API used to log through `console.*`, which produces unstructured text and
 * cannot be filtered or shipped anywhere. Everything now goes through pino:
 * JSON lines with a level, an ISO timestamp, a service name and — where the
 * call site has one — the request id, so a single request can be followed from
 * edge to database.
 *
 * `LOG_LEVEL` overrides the default (`info`, or `silent` under Jest so that the
 * test output stays readable).
 *
 * Tests that assert on logging inject their own instance through
 * `createApp({ logger })` instead of mocking the module.
 */

const pino = require('pino');
const config = require('../config/env');

const DEFAULT_LEVEL = config.nodeEnv === 'test' ? 'silent' : 'info';

/** Fields that must never reach a log sink. */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'newPassword',
  'confirmPassword',
  'token',
  '*.password',
  '*.token',
];

function createLogger(options = {}) {
  return pino({
    level: process.env.LOG_LEVEL || DEFAULT_LEVEL,
    base: { service: 'task-backend', env: config.nodeEnv },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    ...options,
  });
}

const logger = createLogger();

module.exports = logger;
module.exports.createLogger = createLogger;
