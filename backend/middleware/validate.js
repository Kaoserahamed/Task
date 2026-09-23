/**
 * Lightweight input validation middleware for tour payloads.
 *
 * `req.body` for tour create/update arrives as multipart/form-data, so the
 * list-shaped fields (destinations, meals, ...) are JSON-encoded strings.
 * JSON.parse can throw on malformed client input, which previously resulted
 * in an unhandled 500 "Something went wrong!" response. This middleware
 * validates and normalizes those fields up front and returns a consistent
 * { success, error, code } error shape on failure.
 */

/**
 * Parse a JSON-encoded string field. Returns { ok, value }.
 * Accepts already-parsed arrays/objects (e.g. when tests call the controller
 * directly or a JSON body is sent instead of multipart form data).
 */
function parseJsonField(value) {
  if (value === undefined || value === null) {
    return { ok: true, value: undefined };
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return { ok: true, value };
  }
  if (typeof value !== 'string') {
    return { ok: false, value: null };
  }
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (e) {
    return { ok: false, value: null };
  }
}

const ARRAY_FIELDS = ['destinations', 'includes', 'excludes'];
const OBJECT_FIELDS = ['meals', 'transportation'];

/**
 * Validates tour create/update payloads:
 * - required text fields present and non-empty
 * - JSON-encoded list fields (destinations, includes, excludes) parse to arrays
 * - JSON-encoded object fields (meals, transportation) parse to objects
 * - duration parses to an object with numeric days/nights
 * - price, if present, is a non-negative number
 */
function validateTour(req, res, next) {
  const fail = (message) =>
    res.status(400).json({ success: false, error: message, code: 'VALIDATION_ERROR' });

  const body = req.body || {};

  for (const field of ['name', 'description']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return fail(`'${field}' is required and must be a non-empty string`);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (body[field] === undefined) {
      return fail(`'${field}' is required`);
    }
    const { ok, value } = parseJsonField(body[field]);
    if (!ok || !Array.isArray(value)) {
      return fail(`'${field}' must be a JSON-encoded array`);
    }
  }

  for (const field of OBJECT_FIELDS) {
    if (body[field] === undefined) {
      return fail(`'${field}' is required`);
    }
    const { ok, value } = parseJsonField(body[field]);
    if (!ok || !value || Array.isArray(value) || typeof value !== 'object') {
      return fail(`'${field}' must be a JSON-encoded object`);
    }
  }

  // duration is a JSON-encoded object like {"days": "3", "nights": "2"}
  const duration = parseJsonField(body.duration);
  if (
    !duration.ok ||
    !duration.value ||
    typeof duration.value !== 'object' ||
    Array.isArray(duration.value)
  ) {
    return fail("'duration' must be a JSON-encoded object with days/nights");
  }
  const days = Number(duration.value.days);
  const nights = Number(duration.value.nights);
  if (!Number.isFinite(days) || !Number.isFinite(nights) || days < 0 || nights < 0) {
    return fail("'duration.days' and 'duration.nights' must be non-negative numbers");
  }

  if (body.price !== undefined && body.price !== '' && !Number.isFinite(Number(body.price))) {
    return fail("'price' must be a number");
  }

  next();
}

/**
 * Centralized API error responder used by the error-handling middleware so
 * every failure returns the same { success, error, code } shape.
 */
function errorResponse(res, status, message, code) {
  return res.status(status).json({ success: false, error: message, code });
}

module.exports = { validateTour, parseJsonField, errorResponse };
