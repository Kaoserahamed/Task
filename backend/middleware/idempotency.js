'use strict';

const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

const localKeys = new Map();

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Identify the caller so that one requester's cached response can never be
 * replayed to another.
 *
 * The key used to be `sha256(method:url:Idempotency-Key)` and nothing else, so
 * the cache was addressed by a value the *client* chooses. Two callers who
 * picked the same key - which is trivial for `1`, `2`, a timestamp or any
 * fixed string - shared a single entry, and the second was served the first
 * one's response body with `Idempotency-Replayed: true`. On a booking that is
 * another customer's name, phone and address; on a login it is their token.
 *
 * This middleware is mounted before authentication (see app.js), so
 * `req.user` is not populated yet and the caller's `Authorization` header is
 * used instead - hashed, so the credential itself is never part of a cache key
 * or of anything logged. Login and registration present no credential at all;
 * those fall back to the request body so that two different sign-ins cannot
 * collide either.
 */
function callerScope(req) {
  const credential = req.header('Authorization');
  if (credential) return `credential:${sha256(credential)}`;

  let body;
  try {
    body = JSON.stringify(req.body ?? null);
  } catch {
    // A body that cannot be serialised must not fail the request; it only means
    // these callers share a scope, which is still better than keying on the
    // Idempotency-Key alone.
    body = 'unserialisable';
  }
  return `anonymous:${sha256(body)}`;
}

function cacheName(req) {
  return `idempotency:${sha256(
    `${req.method}:${req.originalUrl}:${req.header('Idempotency-Key')}:${callerScope(req)}`
  )}`;
}

function replay(res, value) {
  res.set('Idempotency-Replayed', 'true');
  return res.status(value.statusCode).json(value.body);
}

module.exports = async function idempotency(req, res, next) {
  const key = req.header('Idempotency-Key');
  if (
    !config.idempotency.enabled ||
    !key ||
    !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  ) {
    return next();
  }
  if (key.length > 200)
    return res.status(400).json({
      success: false,
      error: 'Idempotency-Key is too long',
      code: 'INVALID_IDEMPOTENCY_KEY',
    });

  const name = cacheName(req);
  if (localKeys.has(name)) return replay(res, localKeys.get(name));

  try {
    const { getJson } = require('../utils/redis');
    const existing = await getJson(name);
    if (existing) return replay(res, existing);
  } catch (error) {
    logger.warn(
      { err: error, event: 'idempotency.lookup.unavailable' },
      'idempotency lookup unavailable'
    );
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 500) {
      const value = { statusCode: res.statusCode, body };
      localKeys.set(name, value);
      setTimeout(() => localKeys.delete(name), config.idempotency.ttlSeconds * 1000).unref();
      require('../utils/redis')
        .setJson(name, value, config.idempotency.ttlSeconds)
        .catch(() => {});
    }
    return originalJson(body);
  };
  return next();
};
