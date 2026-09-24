'use strict';

/**
 * Request-body guards shared by the company routers.
 *
 * These answer 400 directly instead of throwing, because the company routes
 * respond in their own catch blocks rather than through the central error
 * handler. Keeping them here makes the "required field" rule identical for
 * registration, login and password reset, and unit-testable without a server.
 */

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/** Answer 400 and return false when a required body field is missing. */
function requireFields(res, body, fields) {
  const input = body && typeof body === 'object' ? body : {};
  const missing = fields.find((field) => !isNonEmptyString(input[field]));

  if (missing) {
    res.status(400).json({ message: `"${missing}" is required` });
    return false;
  }

  return true;
}

/** Answer 400 and return false when a password is shorter than `minLength`. */
function requireStrongPassword(res, password, minLength = 8) {
  if (typeof password !== 'string' || password.length < minLength) {
    res.status(400).json({
      message: `"password" must be at least ${minLength} characters`,
    });
    return false;
  }

  return true;
}

module.exports = { isNonEmptyString, requireFields, requireStrongPassword };
