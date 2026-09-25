'use strict';

const request = require('supertest');

const createApp = require('../../app');
const { signAccessToken } = require('../../utils/token');
const { hashPassword, verifyPassword } = require('../../utils/password');

/**
 * Company credential endpoints, end to end through the real application.
 *
 * `companyRoutes.js` was split into `companyAuthRoutes.js` (here) and
 * `companySearchRoutes.js`; these tests pin the URLs, the status codes and the
 * password handling so the split cannot silently change the contract the three
 * front-ends already rely on. The Company model and the transactional-mail
 * SDK are the only modules replaced.
 */

jest.mock('../../models/company', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const Company = jest.fn((fields) => ({ ...fields, _id: 'company-1', save }));
  Company.findOne = jest.fn();
  Company.findById = jest.fn();
  Company.findByIdAndUpdate = jest.fn();
  Company.find = jest.fn();
  Company.schema = { paths: {} };
  Company.__save = save;
  return Company;
});

jest.mock('sib-api-v3-sdk', () => {
  const sendTransacEmail = jest.fn().mockResolvedValue({});
  const TransactionalEmailsApi = jest.fn(() => ({ sendTransacEmail }));
  TransactionalEmailsApi.__sendTransacEmail = sendTransacEmail;
  return {
    ApiClient: { instance: { authentications: { 'api-key': {} } } },
    TransactionalEmailsApi,
  };
});

const Company = require('../../models/company');
const sib = require('sib-api-v3-sdk');

const sendTransacEmail = sib.TransactionalEmailsApi.__sendTransacEmail;

describe('company credential endpoints', () => {
  let app;
  let passwordHash;

  beforeAll(async () => {
    app = createApp();
    passwordHash = await hashPassword('secret123');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Company.findOne.mockResolvedValue(null);
  });

  describe('registration', () => {
    test('POST /company/auth/register creates the account and returns a token', async () => {
      const res = await request(app)
        .post('/company/auth/register')
        .send({ name: 'Ada Tours', email: 'ada@x.io', password: 'secret123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeTruthy();
      expect(res.body.company).toMatchObject({ name: 'Ada Tours', email: 'ada@x.io' });

      const created = Company.mock.calls[0][0];
      expect(created.password).not.toBe('secret123');
      await expect(verifyPassword('secret123', created.password)).resolves.toBe(true);
      expect(Company.__save).toHaveBeenCalled();
    });

    test('rejects a missing name before touching the database', async () => {
      const res = await request(app)
        .post('/company/auth/register')
        .send({ email: 'ada@x.io', password: 'secret123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('"name" is required');
      expect(Company.findOne).not.toHaveBeenCalled();
      expect(Company.__save).not.toHaveBeenCalled();
    });

    test('rejects a non-string registration field before touching the database', async () => {
      const res = await request(app)
        .post('/company/auth/register')
        .send({ name: { unexpected: true }, email: 'ada@x.io', password: 'secret123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('"name" must be a string');
      expect(Company.findOne).not.toHaveBeenCalled();
    });

    test('rejects a password shorter than eight characters', async () => {
      const res = await request(app)
        .post('/company/auth/register')
        .send({ name: 'Ada Tours', email: 'ada@x.io', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 8 characters/);
      expect(Company.findOne).not.toHaveBeenCalled();
    });

    test('reports an existing company instead of creating a duplicate', async () => {
      Company.findOne.mockResolvedValue({ _id: 'company-9' });

      const res = await request(app)
        .post('/company/auth/register')
        .send({ name: 'Ada Tours', email: 'ada@x.io', password: 'secret123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Company already exists');
      expect(Company.__save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('POST /company/auth/login returns a token and no password field', async () => {
      Company.findOne.mockResolvedValue({
        _id: 'company-1',
        name: 'Ada Tours',
        email: 'ada@x.io',
        password: passwordHash,
        isVerified: true,
        verificationStatus: 'approved',
      });

      const res = await request(app)
        .post('/company/auth/login')
        .send({ email: 'ada@x.io', password: 'secret123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.company).toMatchObject({ verificationStatus: 'approved' });
      expect(res.body.company).not.toHaveProperty('password');
    });

    test('answers one 400 for an unknown address and a wrong password', async () => {
      const unknown = await request(app)
        .post('/company/auth/login')
        .send({ email: 'nobody@x.io', password: 'secret123' });

      Company.findOne.mockResolvedValue({ _id: 'company-1', password: passwordHash });
      const wrong = await request(app)
        .post('/company/auth/login')
        .send({ email: 'ada@x.io', password: 'not-it' });

      expect(unknown.status).toBe(400);
      expect(wrong.status).toBe(400);
      expect(unknown.body).toEqual(wrong.body);
      expect(unknown.body.message).toBe('Invalid credentials');
    });
  });

  describe('password reset', () => {
    test('POST /company/auth/reset stores an hour-long token and emails the link', async () => {
      const company = { _id: 'company-1', email: 'ada@x.io', save: jest.fn() };
      Company.findOne.mockResolvedValue(company);

      const res = await request(app)
        .post('/company/auth/reset')
        .send({ email: 'ada@x.io', resetUrl: 'https://app.test/reset-password' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Password reset email sent successfully',
      });
      expect(company.save).toHaveBeenCalled();
      expect(company.resetToken).toMatch(/^[0-9a-f]{64}$/);
      expect(company.resetTokenExpiration).toBeGreaterThan(Date.now());

      const payload = sendTransacEmail.mock.calls[0][0];
      expect(payload.to).toEqual([{ email: 'ada@x.io' }]);
      expect(payload.htmlContent).toContain(
        `https://app.test/reset-password/${company.resetToken}`
      );
    });

    test('reports an unknown address without sending mail', async () => {
      const res = await request(app).post('/company/auth/reset').send({ email: 'nobody@x.io' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No account with that email found');
      expect(sendTransacEmail).not.toHaveBeenCalled();
    });

    test('POST /company/auth/reset-password rejects an expired token', async () => {
      const save = jest.fn();
      Company.findOne.mockResolvedValue({
        _id: 'company-1',
        resetTokenExpiration: Date.now() - 1000,
        save,
      });

      const res = await request(app)
        .post('/company/auth/reset-password')
        .send({ token: 'stale', password: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, message: 'Invalid or expired reset token' });
      expect(Company.findOne).toHaveBeenCalledWith({ resetToken: 'stale' });
      expect(save).not.toHaveBeenCalled();
    });

    test('stores the new password and clears the reset token', async () => {
      const company = {
        _id: 'company-1',
        resetToken: 'good',
        resetTokenExpiration: Date.now() + 60_000,
        save: jest.fn(),
      };
      Company.findOne.mockResolvedValue(company);

      const res = await request(app)
        .post('/company/auth/reset-password')
        .send({ token: 'good', password: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      await expect(verifyPassword('newpass123', company.password)).resolves.toBe(true);
      expect(company.resetToken).toBeUndefined();
      expect(company.resetTokenExpiration).toBeUndefined();
      expect(company.save).toHaveBeenCalled();
    });
  });

  describe('verify-password', () => {
    test('requires an access token', async () => {
      const res = await request(app)
        .post('/company/auth/verify-password')
        .send({ password: 'secret123' });

      expect(res.status).toBe(401);
    });

    test('accepts the right password and refuses the wrong one', async () => {
      Company.findById.mockResolvedValue({ _id: 'company-1', password: passwordHash });
      const token = signAccessToken('company-1', { companyId: 'company-1' });

      const accepted = await request(app)
        .post('/company/auth/verify-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'secret123' });

      const refused = await request(app)
        .post('/company/auth/verify-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'wrong-password' });

      expect(accepted.status).toBe(200);
      expect(accepted.body).toEqual({ success: true });
      expect(refused.status).toBe(401);
      expect(refused.body.message).toBe('Incorrect password');
    });
  });
});
