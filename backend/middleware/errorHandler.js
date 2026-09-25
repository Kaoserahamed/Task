'use strict';

const config = require('../config/env');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * The single place where an error becomes a response body.
 *
 * Every failure leaves the API as `{ success: false, error, code }` — the shape
 * the React clients already read. Errors we raise deliberately (AppError) keep
 * their message and code; error types thrown by Express itself, Mongoose,
 * Multer and jsonwebtoken are translated here so a driver message never leaks.
 * Anything unrecognised is a programmer error: it is logged with its stack and
 * reported to the client as a generic 500.
 */

/** Translate well-known third-party errors into { status, code, message }. */
function classify(err) {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }

  // Mongoose: schema validation failed.
  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors)
      .map((issue) => issue.message)
      .join('; ');
    return { status: 400, code: 'VALIDATION_ERROR', message };
  }

  // Mongoose: an _id (or other typed path) that cannot be cast.
  if (err.name === 'CastError') {
    return { status: 400, code: 'INVALID_IDENTIFIER', message: `Invalid value for '${err.path}'` };
  }

  // MongoDB: unique index violation.
  if (err.code === 11000) {
    return { status: 409, code: 'DUPLICATE_KEY', message: 'Resource already exists' };
  }

  // body-parser.
  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }

  // multer.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return { status: 413, code: 'FILE_TOO_LARGE', message: 'Uploaded file is too large' };
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return {
      status: 400,
      code: 'UNEXPECTED_FILE',
      message: `Unexpected upload field '${err.field}'`,
    };
  }

  // jsonwebtoken.
  if (err.name === 'TokenExpiredError') {
    return { status: 401, code: 'TOKEN_EXPIRED', message: 'Session expired, please sign in again' };
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return { status: 401, code: 'INVALID_TOKEN', message: 'Invalid authentication token' };
  }

  return {
    status: err.status || err.statusCode || 500,
    code: 'INTERNAL_ERROR',
    message: err.message,
  };
}

// Express recognises an error handler by its four-argument signature, so the
// unused `next` parameter is required and intentionally prefixed with `_`.
const errorHandler = (err, req, res, _next) => {
  // A response has already started (static file, streamed upload): hand back to
  // Express, which closes the connection. Writing headers twice would crash.
  if (res.headersSent) {
    return _next(err);
  }

  const classified = classify(err);
  const status = classified.status;
  const isServerError = status >= 500;

  const requestLogger = req.log || logger;

  // A genuine 5xx means something is broken, so keep the stack. 4xx are
  // expected client mistakes and would only flood the log.
  if (isServerError) {
    requestLogger.error(
      { err, requestId: req.id, method: req.method, path: req.originalUrl },
      'request failed'
    );
  } else {
    requestLogger.debug({ requestId: req.id, code: classified.code }, 'request rejected');
  }

  const message =
    isServerError && !err.isOperational && config.isProduction
      ? 'Something went wrong!'
      : classified.message;

  res.status(status).json({
    success: false,
    error: message,
    code: classified.code,
    ...(classified.details ? classified.details : {}),
  });
};

module.exports = errorHandler;
module.exports.classify = classify;
