'use strict';

const { buildCompanyUpdate, FORBIDDEN_FIELDS } = require('../../utils/companyUpdate');
const { passwordResetEmail } = require('../../utils/companyMail');
const {
  isNonEmptyString,
  requireFields,
  requireStrongPassword,
} = require('../../utils/requestValidation');

describe('buildCompanyUpdate', () => {
  const schemaPaths = {
    name: {},
    email: {},
    phone: {},
    description: {},
    isVerified: {},
    verificationStatus: {},
    createdAt: {},
    resetToken: {},
    resetTokenExpiration: {},
    __v: {},
  };

  test('copies the fields the model declares and the request provides', () => {
    const update = buildCompanyUpdate(
      { name: 'Ada Tours', description: 'Small group trips', ignored: 'nope' },
      schemaPaths
    );

    expect(update).toEqual({ name: 'Ada Tours', description: 'Small group trips' });
  });

  test('never copies approval state, the reset token or the schema version', () => {
    const update = buildCompanyUpdate(
      {
        name: 'Ada Tours',
        isVerified: true,
        verificationStatus: 'approved',
        createdAt: '2000-01-01',
        resetToken: 'stolen',
        resetTokenExpiration: 42,
        __v: 9,
      },
      schemaPaths
    );

    expect(update).toEqual({ name: 'Ada Tours' });
    for (const field of ['isVerified', 'verificationStatus', 'resetToken', '__v']) {
      expect(FORBIDDEN_FIELDS.has(field)).toBe(true);
    }
  });

  test('keeps nested documents and drops empty values', () => {
    const update = buildCompanyUpdate(
      { socialLinks: { website: 'https://x.io' }, phone: null, email: undefined },
      schemaPaths
    );

    expect(update).toEqual({ socialLinks: { website: 'https://x.io' } });
  });

  test('tolerates a missing body', () => {
    expect(buildCompanyUpdate(undefined, schemaPaths)).toEqual({});
  });
});

describe('passwordResetEmail', () => {
  test('addresses the company and embeds the one-time link', () => {
    const payload = passwordResetEmail({
      sender: { name: 'Task', email: 'no-reply@task.example' },
      email: 'ada@x.io',
      resetUrl: 'https://app.test/reset-password',
      token: 'abc123',
    });

    expect(payload.to).toEqual([{ email: 'ada@x.io' }]);
    expect(payload.subject).toMatch(/Password Reset/);
    expect(payload.htmlContent).toContain('https://app.test/reset-password/abc123');
    expect(payload.textContent).toMatch(/password reset/i);
  });
});

describe('request validation helpers', () => {
  const fakeRes = () => {
    const res = { statusCode: null, body: null };
    res.status = jest.fn((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn((body) => {
      res.body = body;
      return res;
    });
    return res;
  };

  test('isNonEmptyString rejects blank and non-string values', () => {
    expect(isNonEmptyString('ada')).toBe(true);
    expect(isNonEmptyString('  ')).toBe(false);
    expect(isNonEmptyString(7)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  test('requireFields answers 400 naming the first missing field', () => {
    const res = fakeRes();

    expect(requireFields(res, { email: 'ada@x.io' }, ['name', 'email'])).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('"name" is required');
  });

  test('requireFields accepts a complete body', () => {
    const res = fakeRes();

    expect(requireFields(res, { name: 'Ada', email: 'ada@x.io' }, ['name', 'email'])).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('requireStrongPassword enforces the minimum length', () => {
    const res = fakeRes();

    expect(requireStrongPassword(res, 'short', 8)).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/);
    expect(requireStrongPassword(fakeRes(), 'long-enough', 8)).toBe(true);
  });
});
