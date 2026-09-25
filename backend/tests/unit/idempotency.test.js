'use strict';

const config = require('../../config/env');
const idempotency = require('../../middleware/idempotency');
const redis = require('../../utils/redis');

jest.mock('../../utils/redis', () => ({
  getJson: jest.fn(),
  setJson: jest.fn().mockResolvedValue(true),
}));

const response = () => ({
  statusCode: 200,
  set: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const request = (method = 'POST') => ({
  method,
  originalUrl: '/api/bookings/add',
  header: jest.fn((name) => (name === 'Idempotency-Key' ? `key-${method}` : undefined)),
});

beforeEach(() => {
  jest.clearAllMocks();
  config.idempotency.enabled = true;
  config.idempotency.ttlSeconds = 60;
  redis.getJson.mockResolvedValue(null);
});

describe('idempotency middleware', () => {
  test('passes through requests without an applicable method or key', async () => {
    const next = jest.fn();
    const noKey = { ...request('GET'), header: jest.fn() };
    await idempotency(noKey, response(), next);
    await idempotency(request('POST'), response(), next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('replays a cached response with the replay header', async () => {
    redis.getJson.mockResolvedValue({ statusCode: 201, body: { success: true } });
    const res = response();
    const next = jest.fn();

    await idempotency(request(), res, next);

    expect(res.set).toHaveBeenCalledWith('Idempotency-Replayed', 'true');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects oversized keys and stores successful responses', async () => {
    const longKeyRequest = request();
    longKeyRequest.header = jest.fn(() => 'x'.repeat(201));
    const longKeyResponse = response();
    await idempotency(longKeyRequest, longKeyResponse, jest.fn());
    expect(longKeyResponse.status).toHaveBeenCalledWith(400);

    const res = response();
    const next = jest.fn();
    await idempotency(request(), res, next);
    res.json({ success: true });
    expect(redis.setJson).toHaveBeenCalledWith(
      expect.stringContaining('idempotency:'),
      expect.any(Object),
      60
    );
    expect(next).toHaveBeenCalled();
  });
});
