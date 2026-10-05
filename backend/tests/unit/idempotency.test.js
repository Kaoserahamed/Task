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

/** A request as a real authenticated caller: same key, but a named bearer token. */
const requestAs = (token, { method = 'POST', key = 'shared-key', url, body } = {}) => ({
  method,
  originalUrl: url || '/api/bookings/add',
  body,
  header: jest.fn((name) => {
    if (name === 'Idempotency-Key') return key;
    if (name === 'Authorization') return token;
    return undefined;
  }),
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

describe('idempotency is scoped to the caller', () => {
  // The cache key used to be sha256(method:url:Idempotency-Key) and nothing else,
  // so the entry was addressed by a value the *client* picks. Two callers who
  // chose the same key shared one entry, and the second was handed the first
  // caller's response body.
  test('two callers using the same Idempotency-Key never share a cache entry', async () => {
    const firstResponse = response();
    await idempotency(requestAs('Bearer caller-1-a'), firstResponse, jest.fn());
    firstResponse.json({ success: true, booking: { owner: 'a@example.com' } });

    const secondResponse = response();
    const secondNext = jest.fn();
    await idempotency(requestAs('Bearer caller-1-b'), secondResponse, secondNext);

    expect(secondResponse.set).not.toHaveBeenCalledWith('Idempotency-Replayed', 'true');
    expect(secondNext).toHaveBeenCalled();
  });

  test('the same caller repeating the same key still gets the replay', async () => {
    const firstResponse = response();
    await idempotency(requestAs('Bearer caller-2'), firstResponse, jest.fn());
    firstResponse.json({ success: true, booking: { id: 'booking-1' } });

    const secondResponse = response();
    const secondNext = jest.fn();
    await idempotency(requestAs('Bearer caller-2'), secondResponse, secondNext);

    expect(secondResponse.set).toHaveBeenCalledWith('Idempotency-Replayed', 'true');
    expect(secondResponse.json).toHaveBeenCalledWith({
      success: true,
      booking: { id: 'booking-1' },
    });
    expect(secondNext).not.toHaveBeenCalled();
  });

  test('the same key on a different endpoint is still a different entry', async () => {
    const firstResponse = response();
    await idempotency(requestAs('Bearer caller-3'), firstResponse, jest.fn());
    firstResponse.json({ success: true });

    const secondResponse = response();
    const secondNext = jest.fn();
    await idempotency(
      requestAs('Bearer caller-3', { url: '/api/tours/1/status' }),
      secondResponse,
      secondNext
    );

    expect(secondNext).toHaveBeenCalled();
  });

  test('credential-free writes are scoped by their payload', async () => {
    // Login and registration send no Authorization header, so there is no
    // credential to scope by. Falling back to the body keeps two people signing
    // in with the same key - and the same key on one shared client - from
    // receiving each other's response, which for login means a token.
    const firstResponse = response();
    await idempotency(
      requestAs(undefined, { url: '/user/auth/login', body: { email: 'a@example.com' } }),
      firstResponse,
      jest.fn()
    );
    firstResponse.json({ success: true, token: 'jwt-for-a' });

    const secondResponse = response();
    const secondNext = jest.fn();
    await idempotency(
      requestAs(undefined, { url: '/user/auth/login', body: { email: 'b@example.com' } }),
      secondResponse,
      secondNext
    );

    expect(secondResponse.set).not.toHaveBeenCalledWith('Idempotency-Replayed', 'true');
    expect(secondNext).toHaveBeenCalled();
  });

  test('a body that cannot be serialised still produces a usable key', async () => {
    const circular = {};
    circular.self = circular;
    const req = requestAs('Bearer caller-4');
    req.body = circular;

    const res = response();
    const next = jest.fn();

    await expect(idempotency(req, res, next)).resolves.toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
