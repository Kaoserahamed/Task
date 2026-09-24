'use strict';

/**
 * Application error taxonomy.
 *
 * Handlers throw these instead of writing `res.status(...)` by hand: the central
 * error handler (middleware/errorHandler.js) knows how to translate them into
 * the single API envelope `{ success, error, code }` every client already
 * expects. Because the status and code travel *with* the error, a service can
 * express "this tour does not exist" without knowing it is called over HTTP.
 *
 * `isOperational` marks errors we raise deliberately (a client asked for
 * something impossible) as opposed to programmer errors (a TypeError). Only
 * operational errors keep their message in production.
 */

class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }

  /**
   * Wire shape of the error, minus the (never serialised) stack. Mirrors what
   * middleware/errorHandler.js writes, so controllers and tests can share it.
   */
  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      ...(this.details ? this.details : {}),
    };
  }
}

/** 400 — the request itself is unusable (malformed payload, bad identifier). */
class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'VALIDATION_ERROR', details) {
    super(message, { status: 400, code, details });
  }
}

/** 400 — the request parsed, but a field failed a business rule. */
class ValidationError extends BadRequestError {
  constructor(message = 'Validation failed', details) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/** 401 — no usable credential was presented. */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED', details) {
    super(message, { status: 401, code, details });
  }
}

/** 403 — a credential was presented but is not allowed to do this. */
class ForbiddenError extends AppError {
  constructor(message = 'Not allowed', code = 'FORBIDDEN', details) {
    super(message, { status: 403, code, details });
  }
}

/** 404 — the addressed resource does not exist. */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details) {
    super(message, { status: 404, code, details });
  }
}

/** 409 — the request conflicts with the current state (duplicate key, race). */
class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details) {
    super(message, { status: 409, code, details });
  }
}

/** 429 — the caller exceeded a rate limit. */
class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code = 'RATE_LIMITED', details) {
    super(message, { status: 429, code, details });
  }
}

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
};
