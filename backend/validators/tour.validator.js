'use strict';

/**
 * Tour payload parsing and validation.
 *
 * `req.body` for tour create/update arrives as multipart/form-data, so the
 * list-shaped fields (destinations, meals, ...) are JSON-encoded strings.
 * JSON.parse can throw on malformed client input, which previously resulted in
 * an unhandled 500. This module owns everything about shaping an incoming tour
 * request into the plain object the service layer expects, which means:
 *
 *   - `validateTour` rejects malformed payloads with a typed 400 before any
 *     business code runs;
 *   - `buildCreatePayload` / `buildUpdatePayload` are pure functions, so the
 *     parsing rules are unit-testable without HTTP, a database or files.
 */

const { ValidationError } = require('../utils/errors');

const REQUIRED_TEXT_FIELDS = ['name', 'description'];
const ARRAY_FIELDS = ['destinations', 'includes', 'excludes'];
const OBJECT_FIELDS = ['meals', 'transportation'];
const TOUR_STATUSES = ['approved', 'rejected', 'pending'];

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

/** Number(value) but never NaN — malformed input falls back instead of throwing. */
function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * `packageCategories` is sent either as a JSON array, a comma separated string
 * or a single value; the model always stores an array of lower-case names.
 */
function normalizePackageCategories(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((category) => String(category).trim().toLowerCase()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const { ok, value: parsed } = parseJsonField(value);
    if (ok && Array.isArray(parsed)) {
      return parsed.map((category) => String(category).trim().toLowerCase()).filter(Boolean);
    }
    return value
      .split(',')
      .map((category) => category.trim().toLowerCase())
      .filter(Boolean);
  }

  return [String(value).trim().toLowerCase()];
}

/** Duration is sent as `{"days":"3","nights":"2"}` (numbers optional). */
function normalizeDuration(value) {
  const { ok, value: parsed } = parseJsonField(value);
  if (!ok || !parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError("'duration' must be a JSON-encoded object with days/nights");
  }
  return { days: toNumber(parsed.days, 0), nights: toNumber(parsed.nights, 0) };
}

/** Uploaded files become stored image paths/URLs (Cloudinary sets `path`). */
function toImagePaths(files) {
  if (!Array.isArray(files)) return [];
  return files.map((file) => file.path || file.url).filter(Boolean);
}

function requireJsonArray(value, field) {
  if (value === undefined) {
    throw new ValidationError(`'${field}' is required`);
  }
  const { ok, value: parsed } = parseJsonField(value);
  if (!ok || !Array.isArray(parsed)) {
    throw new ValidationError(`'${field}' must be a JSON-encoded array`);
  }
  return parsed;
}

function requireJsonObject(value, field) {
  if (value === undefined) {
    throw new ValidationError(`'${field}' is required`);
  }
  const { ok, value: parsed } = parseJsonField(value);
  if (!ok || !parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new ValidationError(`'${field}' must be a JSON-encoded object`);
  }
  return parsed;
}

/** Shared by create and update: weather is optional, its temperature numeric. */
function normalizeWeather(value, { required = false } = {}) {
  const { ok, value: parsed } = parseJsonField(value);
  if (!ok) {
    throw new ValidationError("'weather' must be a JSON-encoded object");
  }
  if (!parsed) {
    return required ? {} : undefined;
  }
  return {
    ...parsed,
    ...(parsed.temp !== undefined ? { temp: Number(parsed.temp) || null } : {}),
  };
}

/** Shape the payload for a brand-new tour. Pure: no I/O, no side effects. */
function buildCreatePayload(body = {}, files = []) {
  const payload = {
    ...body,
    destinations: requireJsonArray(body.destinations, 'destinations'),
    includes: requireJsonArray(body.includes, 'includes'),
    excludes: requireJsonArray(body.excludes, 'excludes'),
    meals: requireJsonObject(body.meals, 'meals'),
    transportation: requireJsonObject(body.transportation, 'transportation'),
    duration: normalizeDuration(body.duration),
    price: toNumber(body.price, 0),
    companyId: body.companyId,
    companyName: body.companyName,
  };

  const categories = normalizePackageCategories(body.packageCategories);
  if (categories) payload.packageCategories = categories;

  if (files.length > 0) {
    payload.images = toImagePaths(files);
  }

  if (body.maxGroupSize !== undefined && body.maxGroupSize !== '') {
    payload.maxGroupSize = toNumber(body.maxGroupSize, 0);
  }
  if (body.availableSeats !== undefined && body.availableSeats !== '') {
    payload.availableSeats = toNumber(body.availableSeats, 0);
  }

  const weather = normalizeWeather(body.weather === undefined ? '{}' : body.weather, {
    required: true,
  });
  if (weather) payload.weather = weather;

  if (body.tourType !== undefined) {
    const { ok, value } = parseJsonField(body.tourType);
    if (!ok) throw new ValidationError("'tourType' must be a JSON-encoded object");
    payload.tourType = value;
  }

  return payload;
}

/** Shape the payload for an edit. An edited tour always returns to `draft`. */
function buildUpdatePayload(body = {}, files = []) {
  const payload = {
    ...body,
    destinations: requireJsonArray(body.destinations, 'destinations'),
    includes: requireJsonArray(body.includes, 'includes'),
    excludes: requireJsonArray(body.excludes, 'excludes'),
    meals: requireJsonObject(body.meals, 'meals'),
    transportation: requireJsonObject(body.transportation, 'transportation'),
    duration: normalizeDuration(body.duration),
    price: toNumber(body.price, 0),
    maxGroupSize: toNumber(body.maxGroupSize, 0),
    availableSeats: toNumber(body.availableSeats, 0),
    status: 'draft',
  };

  const categories = normalizePackageCategories(body.packageCategories);
  if (categories) payload.packageCategories = categories;

  const existingImages = parseJsonField(body.existingImages);
  payload.images = [
    ...(existingImages.ok && Array.isArray(existingImages.value) ? existingImages.value : []),
    ...toImagePaths(files),
  ];

  if (body.weather !== undefined) {
    const weather = normalizeWeather(body.weather);
    if (weather) payload.weather = weather;
  }

  // Multipart-only bookkeeping fields must never be persisted.
  delete payload.existingImages;
  delete payload.newImages;

  return payload;
}

/** Build the Mongo filter for `GET /api/tours/filter`. */
function buildFilterQuery({ category, tourType } = {}) {
  const query = {};

  if (category && category !== 'all') {
    if (category === 'custom') {
      query.customCategory = { $exists: true, $ne: '' };
    } else {
      query.packageCategories = category;
    }
  }

  if (tourType && tourType !== 'all') {
    query[`tourType.${tourType}`] = true;
  }

  return query;
}

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

  for (const field of REQUIRED_TEXT_FIELDS) {
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

/** `PATCH /api/tours/:id/status` accepts only the three known review states. */
function validateTourStatus(req, res, next) {
  const { status } = req.body || {};
  if (!TOUR_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `'status' must be one of ${TOUR_STATUSES.join(', ')}`,
      code: 'VALIDATION_ERROR',
    });
  }
  next();
}

/**
 * Seat movements (`book-seats`, `release-seats`) must be whole numbers >= 1.
 * `field` is the body key to inspect, e.g. 'seatsToBook'.
 */
function validateSeatChange(field) {
  return function validateSeatChangeMiddleware(req, res, next) {
    const raw = (req.body || {})[field];
    const seats = Number(raw);
    if (!Number.isInteger(seats) || seats < 1) {
      return res.status(400).json({
        success: false,
        error: `'${field}' must be a whole number of at least 1`,
        code: 'VALIDATION_ERROR',
      });
    }
    req.seats = seats;
    next();
  };
}

module.exports = {
  TOUR_STATUSES,
  parseJsonField,
  toNumber,
  normalizePackageCategories,
  normalizeDuration,
  normalizeWeather,
  toImagePaths,
  buildCreatePayload,
  buildUpdatePayload,
  buildFilterQuery,
  validateTour,
  validateTourStatus,
  validateSeatChange,
};
