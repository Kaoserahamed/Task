'use strict';

const { ValidationError } = require('../utils/errors');

/**
 * Auth payload validation and user serialisation.
 *
 * Every function here is pure: it takes `req.body`/`req.query` and returns plain
 * data, or throws a typed `ValidationError`. Two properties matter beyond
 * catching typos:
 *
 *   - **Unknown fields are dropped.** Each parser builds a new object from an
 *     allow-list, so a client sending `role`, `isVerified` or `password` next to
 *     a profile update cannot reach the model. The User schema has no such
 *     fields today; relying on that is how privilege escalation slips in when
 *     the schema changes.
 *   - **Search input is escaped** before it becomes a RegExp. `new RegExp(user
 *     input)` throws on unbalanced groups (`[`, `(`), which turned a bad search
 *     box into a 500.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 120;
const PHONE_MAX_LENGTH = 32;
const SEARCH_MAX_LENGTH = 120;

const asObject = (value) => (value && typeof value === 'object' ? value : {});

const requiredString = (value, field, { max, min = 1 } = {}) => {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new ValidationError(`"${field}" is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ValidationError(`"${field}" must be at most ${max} characters`);
  }
  return trimmed;
};

const optionalString = (value, field, options = {}) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requiredString(value, field, options);
};

const normaliseEmail = (value, field = 'email') => {
  const email = requiredString(value, field, { max: 320 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError(`"${field}" must be a valid email address`);
  }
  return email;
};

const requiredPassword = (value, field = 'password') => {
  const password = requiredString(value, field, { max: 200 });
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(`"${field}" must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  return password;
};

/** POST /user/auth/register */
function parseRegister(body) {
  const input = asObject(body);
  return {
    name: requiredString(input.name, 'name', { max: NAME_MAX_LENGTH }),
    email: normaliseEmail(input.email),
    password: requiredPassword(input.password),
  };
}

/** POST /user/auth/login */
function parseLogin(body) {
  const input = asObject(body);
  return {
    email: normaliseEmail(input.email),
    password: requiredString(input.password, 'password', { max: 200 }),
  };
}

/**
 * PUT /user/auth/update — a partial update. At least one known field has to be
 * present, otherwise the request is a no-op that would answer 200 and change
 * nothing.
 */
function parseProfileUpdate(body) {
  const input = asObject(body);
  const patch = {
    name: optionalString(input.name, 'name', { max: NAME_MAX_LENGTH }),
    email: input.email === undefined ? undefined : normaliseEmail(input.email),
    phone: optionalString(input.phone, 'phone', { max: PHONE_MAX_LENGTH }),
  };

  const present = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (present.length === 0) {
    throw new ValidationError('Provide at least one of: name, email, phone');
  }

  return Object.fromEntries(present);
}

/** GET /user/auth/search?query=... */
function parseSearch(query) {
  const input = asObject(query);
  const term = requiredString(input.query, 'query', { max: SEARCH_MAX_LENGTH });
  return { term };
}

/** Escape a user-supplied string so it can be embedded in a RegExp literally. */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build the case-insensitive search pattern the repository expects. */
function buildSearchPattern(term) {
  return new RegExp(escapeRegExp(term), 'i');
}

/** POST /user/auth/reset */
function parseResetRequest(body) {
  const input = asObject(body);
  return {
    email: normaliseEmail(input.email),
    resetUrl: requiredString(input.resetUrl, 'resetUrl', { max: 500 }),
  };
}

/** POST /user/auth/reset-password */
function parseResetPassword(body) {
  const input = asObject(body);
  return {
    token: requiredString(input.token, 'token', { max: 200 }),
    password: requiredPassword(input.password),
  };
}

/** POST /user/auth/avatar */
function parseAvatarRequest(file) {
  if (!file) {
    throw new ValidationError('No file uploaded');
  }
  return {
    // Stored relative to the uploads directory, with Windows separators
    // normalised so the value is identical on every platform.
    avatar: String(file.path).replace(/\\/g, '/'),
  };
}

/**
 * The only user shape that leaves the process (C6.7, least data exposure).
 * The password hash and the reset token are not part of it, so no controller
 * can leak them by forgetting a projection.
 */
function serializeUser(user) {
  if (!user) {
    return null;
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
  };
}

module.exports = {
  EMAIL_PATTERN,
  PASSWORD_MIN_LENGTH,
  buildSearchPattern,
  escapeRegExp,
  parseAvatarRequest,
  parseLogin,
  parseProfileUpdate,
  parseRegister,
  parseResetPassword,
  parseResetRequest,
  parseSearch,
  serializeUser,
};
