'use strict';

const Redis = require('ioredis');
const config = require('../config/env');
const logger = require('./logger');

let client;
let connecting;

function getClient() {
  if (!config.redis.url) return null;
  if (client) return client;

  client = new Redis(config.redis.url, {
    lazyConnect: true,
    connectTimeout: config.redis.connectTimeoutMs,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (attempt) => Math.min(attempt * 100, 2000),
  });
  client.on('error', (error) => logger.warn({ err: error }, 'redis unavailable'));
  client.on('ready', () => logger.info('redis connected'));
  return client;
}

async function ensureConnected() {
  const redis = getClient();
  if (!redis) return null;
  if (redis.status === 'ready') return redis;
  if (!connecting) {
    connecting = redis.connect().catch((error) => {
      logger.warn({ err: error }, 'redis connection failed; continuing without cache');
      return null;
    }).finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

function key(name) {
  return `${config.redis.keyPrefix}${name}`;
}

async function getJson(name) {
  const redis = await ensureConnected();
  if (!redis) return null;
  try {
    const value = await redis.get(key(name));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn({ err: error }, 'redis get failed');
    return null;
  }
}

async function setJson(name, value, ttlSeconds = 300) {
  const redis = await ensureConnected();
  if (!redis) return false;
  try {
    await redis.set(key(name), JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'redis set failed');
    return false;
  }
}

async function enqueue(name, payload) {
  const redis = await ensureConnected();
  if (!redis) return false;
  try {
    await redis.rpush(key(`queue:${name}`), JSON.stringify(payload));
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'redis enqueue failed');
    return false;
  }
}

async function dequeue(name, timeoutSeconds = 0) {
  const redis = await ensureConnected();
  if (!redis) return null;
  const result = timeoutSeconds
    ? await redis.brpop(key(`queue:${name}`), timeoutSeconds)
    : await redis.lpop(key(`queue:${name}`));
  return result ? JSON.parse(result[1]) : null;
}

async function close() {
  if (!client) return;
  await client.quit().catch(() => client.disconnect());
  client = null;
}

module.exports = { getClient, ensureConnected, getJson, setJson, enqueue, dequeue, close };
