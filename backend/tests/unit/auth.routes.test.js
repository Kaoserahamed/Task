'use strict';

const request = require('supertest');

const createApp = require('../../app');
const repository = require('../../repositories/user.repository');
const { signAccessToken } = require('../../utils/token');

/**
 * Auth HTTP surface, end to end through the real application.
 *
 * Only the repository and the mailer are replaced: the router, validators,
 * controller, service, auth middleware, central error handler and JSON envelope
 * are all production code paths. This proves the layering holds together — the
 * route no longer knows how to hash a password or query Mongo, yet the endpoint
 * still answers exactly what the front-ends expect.
 */

jest.mock('../../repositories/user.repository');
jest.mock('../../services/mail.service');

const mail = require('../../services/mail.service');

describe('auth HTTP surface', () => {
  let app;
  let token;

  beforeAll(() => {
    app = createApp();
    token = signAccessToken('user-1');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mail.sendPasswordReset.mockResolvedValue({ sent: true });
    repository.create.mockResolvedValue({ _id: 'user-1', name: 'Ada', email: 'ada@x.io' });
    repository.existsByEmail.mockResolvedValue(false);
    repository.findByEmail.mockResolvedValue(null);
    repository.searchByName.mockResolvedValue([]);
  });

  describe('register / login', () => {
    test('POST /user/auth/register answers 201 with a token', async () => {
      const res = await request(app)
        .post('/user/auth/register')
        .send({ name: 'Ada', email: 'ada@x.io', password: 'secret123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user).toMatchObject({ email: 'ada@x.io' });
      expect(res.body.user).not.toHaveProperty('password');
    });

    test('POST /user/auth/register reports a duplicate as 409, not 500', async () => {
      repository.existsByEmail.mockResolvedValue(true);

      const res = await request(app)
        .post('/user/auth/register')
        .send({ name: 'Ada', email: 'ada@x.io', password: 'secret123' });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ success: false, code: 'EMAIL_TAKEN' });
    });

    test('POST /user/auth/register rejects an invalid payload at the edge', async () => {
      const res = await request(app)
        .post('/user/auth/register')
        .send({ name: 'Ada', email: 'not-an-email', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(repository.create).not.toHaveBeenCalled();
    });

    test('POST /user/auth/login answers 401 with one message for both failure modes', async () => {
      const unknown = await request(app)
        .post('/user/auth/login')
        .send({ email: 'nobody@x.io', password: 'secret123' });

      repository.findByEmail.mockResolvedValue({ _id: 'user-1', password: 'hashed:other' });
      const wrongPassword = await request(app)
        .post('/user/auth/login')
        .send({ email: 'ada@x.io', password: 'secret123' });

      expect(unknown.status).toBe(401);
      expect(wrongPassword.status).toBe(401);
      expect(unknown.body).toEqual(wrongPassword.body);
    });
  });

  describe('authenticated profile', () => {
    test('GET /user/auth/me requires a token', async () => {
      const res = await request(app).get('/user/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('NO_TOKEN');
    });

    test('GET /user/auth/me returns the user without the password', async () => {
      repository.findByIdWithoutPassword.mockResolvedValue({
        _id: 'user-1',
        name: 'Ada',
        email: 'ada@x.io',
      });

      const res = await request(app).get('/user/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ name: 'Ada' });
      expect(res.body.user).not.toHaveProperty('password');
      expect(repository.findByIdWithoutPassword).toHaveBeenCalledWith('user-1');
    });

    test('a malformed token is rejected without echoing it', async () => {
      const res = await request(app)
        .get('/user/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
      expect(JSON.stringify(res.body)).not.toMatch(/not-a-real-token/);
    });

    test('PUT /user/auth/update ignores fields outside the allow-list', async () => {
      repository.updateById.mockResolvedValue({ _id: 'user-1', name: 'Ada' });

      const res = await request(app)
        .put('/user/auth/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ada', role: 'admin', isVerified: true });

      expect(res.status).toBe(200);
      expect(repository.updateById).toHaveBeenCalledWith('user-1', { name: 'Ada' });
    });

    test('PUT /user/auth/update rejects an empty patch', async () => {
      const res = await request(app)
        .put('/user/auth/update')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(repository.updateById).not.toHaveBeenCalled();
    });

    test('POST /user/auth/avatar requires a token', async () => {
      const res = await request(app).post('/user/auth/avatar').attach('avatar', Buffer.from('x'), {
        filename: 'a.png',
        contentType: 'image/png',
      });

      expect(res.status).toBe(401);
      expect(repository.setAvatarById).not.toHaveBeenCalled();
    });

    test('POST /user/auth/avatar updates the token owner, not the address in the body', async () => {
      repository.setAvatarById.mockResolvedValue({ _id: 'user-1', avatar: 'uploads/a.png' });

      const res = await request(app)
        .post('/user/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .field('email', 'victim@x.io')
        .attach('avatar', Buffer.from('x'), { filename: 'a.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
      expect(repository.setAvatarById).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('a.png')
      );
    });
  });

  describe('search', () => {
    test('GET /user/auth/search returns matches', async () => {
      repository.searchByName.mockResolvedValue([{ _id: 'c1', name: 'Ada Tours' }]);

      const res = await request(app).get('/user/auth/search?query=ada');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
      expect(res.body.users).toHaveLength(1);
    });

    test('GET /user/auth/search requires the query parameter', async () => {
      const res = await request(app).get('/user/auth/search');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('a regex metacharacter in the query is a search, not a crash', async () => {
      const res = await request(app).get('/user/auth/search?query=%5B');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
    });
  });

  describe('password reset', () => {
    test('POST /user/auth/reset answers the same way for a known and unknown address', async () => {
      repository.findByEmail.mockResolvedValue({ _id: 'user-1' });
      const known = await request(app)
        .post('/user/auth/reset')
        .send({ email: 'ada@x.io', resetUrl: 'https://app.test/reset-password' });

      repository.findByEmail.mockResolvedValue(null);
      const unknown = await request(app)
        .post('/user/auth/reset')
        .send({ email: 'nobody@x.io', resetUrl: 'https://app.test/reset-password' });

      expect(known.status).toBe(200);
      expect(unknown.status).toBe(200);
      expect(known.body).toEqual(unknown.body);
      expect(unknown.body).toMatchObject({ success: true });
    });

    test('POST /user/auth/reset does not send mail for an unknown address', async () => {
      await request(app)
        .post('/user/auth/reset')
        .send({ email: 'nobody@x.io', resetUrl: 'https://app.test/reset-password' });

      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    test('POST /user/auth/reset-password rejects an expired token', async () => {
      repository.findOneByResetToken.mockResolvedValue({
        _id: 'user-1',
        resetTokenExpiration: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .post('/user/auth/reset-password')
        .send({ token: 'stale', password: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_RESET_TOKEN');
      expect(repository.setPassword).not.toHaveBeenCalled();
    });

    test('POST /user/auth/reset-password stores the new password and clears the token', async () => {
      repository.findOneByResetToken.mockResolvedValue({
        _id: 'user-1',
        resetTokenExpiration: new Date(Date.now() + 60_000),
      });
      repository.setPassword.mockResolvedValue({ _id: 'user-1' });

      const res = await request(app)
        .post('/user/auth/reset-password')
        .send({ token: 'good', password: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(repository.setPassword).toHaveBeenCalledWith('user-1', expect.any(String));
      expect(repository.clearResetToken).toHaveBeenCalledWith('user-1');
    });
  });
});
