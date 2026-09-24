'use strict';

const request = require('supertest');

const createApp = require('../../app');

/**
 * The application factory is exercised through supertest: the real middleware
 * chain (request id, helmet, CORS, JSON parsing, routers, 404, error handler)
 * without a listener or a database connection.
 */

describe('application wiring', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('GET / reports the runtime environment', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', environment: 'test' });
  });

  test('GET /health/live is a liveness probe that never touches the database', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('alive');
    expect(typeof res.body.uptime).toBe('number');
  });

  test('GET /health/ready reports 503 while the database is unreachable', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'degraded', database: 'disconnected' });
  });

  test('GET /health keeps its historical shape', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'healthy', database: 'disconnected' });
  });

  test('GET /api/test still answers', async () => {
    const res = await request(app).get('/api/test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'API is working' });
  });

  test('an unknown route returns the standard error envelope', async () => {
    const res = await request(app).get('/definitely/not/a/route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: 'Cannot GET /definitely/not/a/route',
      code: 'NOT_FOUND',
    });
  });

  test('a malformed JSON body is a 400, not a 500', async () => {
    const res = await request(app)
      .post('/api/tours')
      .set('Content-Type', 'application/json')
      .send('{"name": "broken"');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_JSON');
  });

  test('seed endpoints stay unmounted unless SEED_ENABLED=true', async () => {
    const res = await request(app).get('/api/seed-tours');

    expect(res.status).toBe(404);
  });

  test('does not advertise the framework', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('echoes a caller supplied request id and generates one otherwise', async () => {
    const echoed = await request(app).get('/health').set('x-request-id', 'trace-me');
    const generated = await request(app).get('/health');

    expect(echoed.headers['x-request-id']).toBe('trace-me');
    expect(generated.headers['x-request-id']).toMatch(/[0-9a-f-]{36}/);
  });
});

describe('CORS policy', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('allows a loopback origin outside production', async () => {
    const res = await request(app)
      .options('/api/tours')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('refuses an unlisted origin instead of reflecting it', async () => {
    const res = await request(app)
      .options('/api/tours')
      .set('Origin', 'https://evil-vercel.app.attacker.example')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CORS_BLOCKED');
  });

  test('allows a request with no Origin header (curl, server-to-server)', async () => {
    const res = await request(app).get('/api/test');

    expect(res.status).toBe(200);
  });
});
