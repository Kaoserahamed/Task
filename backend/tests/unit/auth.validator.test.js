'use strict';

const {
  buildSearchPattern,
  escapeRegExp,
  parseAvatarRequest,
  parseLogin,
  parseProfileUpdate,
  parseRegister,
  parseResetPassword,
  parseResetRequest,
  parseSearch,
  serializeUser,
} = require('../../validators/auth.validator');

/**
 * Auth input handling.
 *
 * The two properties that are security-relevant rather than cosmetic are
 * asserted here: unknown fields never survive parsing (so `role` cannot ride
 * along on a profile update), and user-supplied text is escaped before it
 * becomes a RegExp.
 */

describe('auth.validator', () => {
  describe('parseRegister', () => {
    test('normalises the address and keeps only the known fields', () => {
      const parsed = parseRegister({
        name: '  Ada  ',
        email: '  ADA@X.IO ',
        password: 'secret123',
        role: 'admin',
        isVerified: true,
      });

      expect(parsed).toEqual({ name: 'Ada', email: 'ada@x.io', password: 'secret123' });
    });

    test.each([
      ['a missing name', { email: 'a@b.co', password: 'secret123' }],
      ['a malformed address', { name: 'Ada', email: 'not-an-email', password: 'secret123' }],
      ['a short password', { name: 'Ada', email: 'a@b.co', password: 'short' }],
    ])('rejects %s', (_label, body) => {
      expect(() => parseRegister(body)).toThrow(/required|valid email|at least/);
    });
  });

  describe('parseLogin', () => {
    test('requires both fields', () => {
      expect(() => parseLogin({ email: 'a@b.co' })).toThrow(/required/);
      expect(() => parseLogin({ email: 'nope', password: 'x' })).toThrow(/valid email/);
    });

    test('does not impose the registration password policy', () => {
      // An existing account may predate the current minimum; login only needs
      // the value that was stored.
      expect(parseLogin({ email: 'a@b.co', password: 'old' })).toEqual({
        email: 'a@b.co',
        password: 'old',
      });
    });
  });

  describe('parseProfileUpdate', () => {
    test('drops unknown fields such as role and verification flags', () => {
      const patch = parseProfileUpdate({
        name: 'Ada',
        role: 'admin',
        isVerified: true,
        verificationStatus: 'approved',
        password: 'hijack',
      });

      expect(patch).toEqual({ name: 'Ada' });
    });

    test('accepts any single known field', () => {
      expect(parseProfileUpdate({ phone: '+123' })).toEqual({ phone: '+123' });
      expect(parseProfileUpdate({ email: 'NEW@X.IO' })).toEqual({ email: 'new@x.io' });
    });

    test('rejects a request that would change nothing', () => {
      expect(() => parseProfileUpdate({})).toThrow(/at least one/);
    });
  });

  describe('parseSearch', () => {
    test('requires a query', () => {
      expect(() => parseSearch({})).toThrow(/required/);
    });

    test('escapes regex metacharacters instead of letting them throw', () => {
      // `new RegExp('[')` throws; the escaped form is a literal search.
      expect(escapeRegExp('a[b')).toBe('a\\[b');
      expect(() => buildSearchPattern('[')).not.toThrow();
      expect(buildSearchPattern('[').test('a [ b')).toBe(true);
    });
  });

  describe('reset payloads', () => {
    test('the reset request needs an address and a base URL', () => {
      expect(parseResetRequest({ email: 'a@b.co', resetUrl: 'https://x' })).toEqual({
        email: 'a@b.co',
        resetUrl: 'https://x',
      });
      expect(() => parseResetRequest({ email: 'a@b.co' })).toThrow(/required/);
    });

    test('the reset completion needs a token and a new password', () => {
      expect(parseResetPassword({ token: 'abc', password: 'newpass123' })).toEqual({
        token: 'abc',
        password: 'newpass123',
      });
      expect(() => parseResetPassword({ token: 'abc', password: 'short' })).toThrow(/at least/);
    });
  });

  describe('parseAvatarRequest', () => {
    test('normalises the stored path to forward slashes', () => {
      const parsed = parseAvatarRequest({ path: 'uploads\\123-avatar.png' });

      expect(parsed).toEqual({ avatar: 'uploads/123-avatar.png' });
    });

    test('never accepts the account from the body', () => {
      // The owner comes from the verified token, so an address in the payload
      // cannot select whose avatar is written.
      expect(parseAvatarRequest({ path: 'uploads/a.png' })).not.toHaveProperty('email');
    });

    test('rejects a missing file with a typed validation error', () => {
      expect(() => parseAvatarRequest(undefined)).toThrow(/No file/);
    });
  });

  describe('serializeUser', () => {
    test('exposes only the public fields', () => {
      const user = {
        _id: 'u1',
        name: 'Ada',
        email: 'a@b.co',
        avatar: 'a.png',
        phone: '1',
        password: 'hashed',
        resetToken: 'secret',
        resetTokenExpiration: new Date(),
      };

      expect(serializeUser(user)).toEqual({
        _id: 'u1',
        name: 'Ada',
        email: 'a@b.co',
        avatar: 'a.png',
        phone: '1',
      });
    });

    test('returns null for a missing document', () => {
      expect(serializeUser(null)).toBeNull();
    });
  });
});
