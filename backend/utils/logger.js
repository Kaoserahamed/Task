'use strict';

const { AsyncLocalStorage } = require('node:async_hooks');
const pino = require('pino');
const config = require('../config/env');

const DEFAULT_LEVEL = config.nodeEnv === 'test' ? 'silent' : 'info';
const requestContext = new AsyncLocalStorage();

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

const rootLogger = createLogger();

function getLogger() {
  return requestContext.getStore() || rootLogger;
}

function createRequestLogger(requestId) {
  return rootLogger.child({ requestId });
}

function withRequestContext(requestId, callback) {
  const requestLogger = createRequestLogger(requestId);
  return requestContext.run(requestLogger, callback);
}

const logger = {
  trace: (...args) => getLogger().trace(...args),
  debug: (...args) => getLogger().debug(...args),
  info: (...args) => getLogger().info(...args),
  warn: (...args) => getLogger().warn(...args),
  error: (...args) => getLogger().error(...args),
  fatal: (...args) => getLogger().fatal(...args),
  child: (bindings) => getLogger().child(bindings),
};

module.exports = logger;
module.exports.createLogger = createLogger;
module.exports.createRequestLogger = createRequestLogger;
module.exports.withRequestContext = withRequestContext;
