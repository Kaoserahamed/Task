'use strict';

const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

const localKeys = new Map();

function cacheName(req) {
  return `idempotency:${crypto
    .createHash('sha256')
    .update(`${req.method}:${req.originalUrl}:${req.header('Idempotency-Key')}`)
    .digest('hex')}`;
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
    logger.warn({ err: error }, 'idempotency lookup unavailable');
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
