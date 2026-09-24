'use strict';

/**
 * Build the field set a company may change about itself.
 *
 * `PATCH /update-info` used to inline this allow-list next to the request
 * handler. It is extracted because the rule is a security boundary, not HTTP
 * plumbing: approval state (`verificationStatus`, `isVerified`), the reset
 * token and the immutable identifiers must never be written from a profile
 * request, however the model grows later.
 */

const FORBIDDEN_FIELDS = new Set([
  '_id',
  'verificationStatus',
  'isVerified',
  'createdAt',
  'resetToken',
  'resetTokenExpiration',
  '__v',
]);

// Nested documents are not schema leaves, so they are copied explicitly.
const NESTED_FIELDS = ['socialLinks', 'documents'];

const hasValue = (body, field) =>
  Object.prototype.hasOwnProperty.call(body, field) &&
  body[field] !== undefined &&
  body[field] !== null;

function buildCompanyUpdate(body, schemaPaths = {}) {
  const input = body && typeof body === 'object' ? body : {};
  const update = {};

  for (const field of Object.keys(schemaPaths)) {
    if (FORBIDDEN_FIELDS.has(field)) continue;
    if (hasValue(input, field)) update[field] = input[field];
  }

  for (const field of NESTED_FIELDS) {
    if (hasValue(input, field)) update[field] = input[field];
  }

  return update;
}

module.exports = { buildCompanyUpdate, FORBIDDEN_FIELDS, NESTED_FIELDS };
