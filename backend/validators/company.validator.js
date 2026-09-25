'use strict';

/**
 * Company request-body schemas.
 *
 * The Mongoose model describes persistence, not the HTTP trust boundary. These
 * parsers make the accepted company API contract explicit: values are checked
 * before a database call, fields outside the endpoint allow-list are dropped,
 * and company-owned profile requests cannot write approval or identity fields.
 *
 * The module is dependency-free to keep the security boundary small and easy to
 * audit. Every parser is pure and throws ValidationError on the first invalid
 * field, which the route middleware turns into a 400 response.
 */

const { ValidationError } = require('../utils/errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 200;
const NAME_MAX_LENGTH = 120;
const PHONE_MAX_LENGTH = 32;
const SHORT_TEXT_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;
const URL_MAX_LENGTH = 2048;
const RESET_URL_MAX_LENGTH = 500;
const DATE_MAX_LENGTH = 40;
const DOCUMENT_LIMIT = 20;
const COMPANY_VERIFICATION_STATUSES = ['Not Verified', 'pending', 'approved', 'rejected'];

const TEXT_FIELDS = {
  name: { max: NAME_MAX_LENGTH },
  email: { max: 320, format: 'email' },
  phone: { max: PHONE_MAX_LENGTH },
  address: { max: SHORT_TEXT_MAX_LENGTH },
  website: { max: URL_MAX_LENGTH, format: 'url' },
  description: { max: DESCRIPTION_MAX_LENGTH },
  logo: { max: URL_MAX_LENGTH, format: 'url-or-path' },
  ownerName: { max: NAME_MAX_LENGTH },
  ownerEmail: { max: 320, format: 'email' },
  ownerPhone: { max: PHONE_MAX_LENGTH },
  ownerAddress: { max: SHORT_TEXT_MAX_LENGTH },
  ownerNationalId: { max: SHORT_TEXT_MAX_LENGTH },
  ownerNationality: { max: NAME_MAX_LENGTH },
  ownerPhoto: { max: URL_MAX_LENGTH, format: 'url-or-path' },
  registrationNumber: { max: SHORT_TEXT_MAX_LENGTH },
  taxId: { max: SHORT_TEXT_MAX_LENGTH },
  licenseNumber: { max: SHORT_TEXT_MAX_LENGTH },
};

const PROFILE_FIELDS = {
  name: TEXT_FIELDS.name,
  email: TEXT_FIELDS.email,
  phone: TEXT_FIELDS.phone,
};

const COMPANY_INFO_FIELDS = {
  ...TEXT_FIELDS,
  ownerDob: { format: 'date' },
  licenseExpiry: { format: 'date' },
  verificationDocuments: { format: 'documents' },
  documents: { format: 'documents' },
  socialLinks: { format: 'social-links' },
};

const SOCIAL_LINK_FIELDS = ['facebook', 'twitter', 'linkedin', 'instagram', 'website'];

function asBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('Request body must be a JSON object');
  }
  return value;
}

function hasValue(input, field) {
  return Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined;
}

function parseString(value, field, { max, required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`"${field}" is required`);
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`"${field}" must be a string`);
  }
  const result = value.trim();
  if (required && result.length === 0) {
    throw new ValidationError(`"${field}" is required`);
  }
  if (result.length > max) {
    throw new ValidationError(`"${field}" must be at most ${max} characters`);
  }
  return result || undefined;
}

function parseEmail(value, field, options = {}) {
  const email = parseString(value, field, { ...options, max: options.max || 320 });
  if (email === undefined) return undefined;
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError(`"${field}" must be a valid email address`);
  }
  return email.toLowerCase();
}

function parsePassword(value, field = 'password', { required = true } = {}) {
  const password = parseString(value, field, { max: PASSWORD_MAX_LENGTH, required });
  if (password !== undefined && password.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(`"${field}" must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  return password;
}

function parseUrl(value, field, { allowRelative = false } = {}) {
  const max = field === 'resetUrl' ? RESET_URL_MAX_LENGTH : URL_MAX_LENGTH;
  const raw = parseString(value, field, { max });
  if (raw === undefined) return undefined;
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error('unsupported URL');
    }
    return parsed.toString();
  } catch (_error) {
    if (allowRelative && /^\/(?!\/)[^\s]*$/.test(raw)) return raw;
    throw new ValidationError(`"${field}" must be a valid http(s) URL`);
  }
}

function parseDate(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (
    typeof value !== 'string' ||
    value.length > DATE_MAX_LENGTH ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new ValidationError(`"${field}" must be a valid date`);
  }
  return value;
}

function parseFields(input, schema) {
  const result = {};
  for (const [field, rules] of Object.entries(schema)) {
    if (!hasValue(input, field) || input[field] === null || input[field] === '') continue;
    if (rules.format === 'email') result[field] = parseEmail(input[field], field, rules);
    else if (rules.format === 'url') result[field] = parseUrl(input[field], field);
    else if (rules.format === 'url-or-path')
      result[field] = parseUrl(input[field], field, { allowRelative: true });
    else if (rules.format === 'date') result[field] = parseDate(input[field], field);
    else if (rules.format === 'documents') result[field] = parseDocumentList(input[field], field);
    else if (rules.format === 'social-links') result[field] = parseSocialLinks(input[field]);
    else result[field] = parseString(input[field], field, rules);
  }
  return result;
}

function requireSomeFields(body, message = 'Provide at least one valid field') {
  if (Object.keys(body).length === 0) throw new ValidationError(message);
  return body;
}

function parseCompanyRegister(body) {
  const input = asBody(body);
  return {
    name: parseString(input.name, 'name', { max: NAME_MAX_LENGTH, required: true }),
    email: parseEmail(input.email, 'email', { required: true }),
    password: parsePassword(input.password),
  };
}

function parseCompanyLogin(body) {
  const input = asBody(body);
  return {
    email: parseEmail(input.email, 'email', { required: true }),
    // Login must accept any bounded credential string so an account created
    // before the current password policy can still be checked safely.
    password: parseString(input.password, 'password', { max: PASSWORD_MAX_LENGTH, required: true }),
  };
}

function parseCompanyReset(body) {
  const input = asBody(body);
  return {
    email: parseEmail(input.email, 'email', { required: true }),
    resetUrl: parseUrl(input.resetUrl, 'resetUrl'),
  };
}

function parseCompanyResetPassword(body) {
  const input = asBody(body);
  return {
    token: parseString(input.token, 'token', { max: 200, required: true }),
    password: parsePassword(input.password),
  };
}

function parseCompanyVerifyPassword(body) {
  const input = asBody(body);
  return {
    password: parseString(input.password, 'password', { max: PASSWORD_MAX_LENGTH, required: true }),
  };
}

function parseCompanyProfileUpdate(body) {
  return requireSomeFields(parseFields(asBody(body), PROFILE_FIELDS));
}

function parseCompanyInfoUpdate(body) {
  const input = asBody(body);
  const result = parseFields(input, COMPANY_INFO_FIELDS);
  if (hasValue(input, 'verificationStatus')) {
    if (input.verificationStatus !== 'pending') {
      throw new ValidationError('"verificationStatus" may only be set to "pending" by a company');
    }
    result.verificationStatus = 'pending';
  }
  return requireSomeFields(result, 'No valid fields provided for update.');
}

function parseCompanyVerificationUpdate(body) {
  const input = asBody(body);
  const result = {};
  if (hasValue(input, 'companyId')) {
    result.companyId = parseString(input.companyId, 'companyId', { max: 128, required: true });
  }
  if (hasValue(input, 'verificationStatus')) {
    if (!COMPANY_VERIFICATION_STATUSES.includes(input.verificationStatus)) {
      throw new ValidationError('Unknown verification status');
    }
    result.verificationStatus = input.verificationStatus;
  }
  if (hasValue(input, 'isVerified')) {
    if (typeof input.isVerified !== 'boolean') {
      throw new ValidationError('"isVerified" must be a boolean');
    }
    result.isVerified = input.isVerified;
  }
  if (
    result.companyId !== undefined &&
    result.verificationStatus === undefined &&
    result.isVerified === undefined
  ) {
    throw new ValidationError('Provide verificationStatus or isVerified with companyId');
  }
  return requireSomeFields(result, 'Provide a companyId, verificationStatus, or isVerified');
}

function validateCompanyBody(parser) {
  return function validateCompanyBodyMiddleware(req, res, next) {
    try {
      req.companyBody = parser(req.body);
      return next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message, code: error.code });
      }
      return next(error);
    }
  };
}

function parseDocumentList(value, field) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > DOCUMENT_LIMIT) {
    throw new ValidationError(`"${field}" must be an array of at most ${DOCUMENT_LIMIT} documents`);
  }
  return value.map((document, index) =>
    parseUrl(document, `${field}[${index}]`, { allowRelative: true })
  );
}

function parseSocialLinks(value) {
  if (value === undefined || value === null) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('"socialLinks" must be an object');
  }
  const links = {};
  for (const field of SOCIAL_LINK_FIELDS) {
    const link = parseUrl(value[field], `socialLinks.${field}`);
    if (link !== undefined) links[field] = link;
  }
  return links;
}

module.exports = {
  COMPANY_VERIFICATION_STATUSES,
  validateCompanyBody,
  parseCompanyRegister,
  parseCompanyLogin,
  parseCompanyReset,
  parseCompanyResetPassword,
  parseCompanyVerifyPassword,
  parseCompanyProfileUpdate,
  parseCompanyInfoUpdate,
  parseCompanyVerificationUpdate,
};
