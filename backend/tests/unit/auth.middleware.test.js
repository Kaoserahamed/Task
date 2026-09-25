'use strict';

const authMiddleware = require('../../middleware/authMiddleware');
const adminAuth = require('../../middleware/adminAuth');
const { signAccessToken } = require('../../utils/token');

const request = (authorization) => ({
  header: jest.fn((name) => (name === 'Authorization' ? authorization : undefined)),
  headers: authorization ? { authorization } : {},
});

describe('authentication middleware', () => {
  test('rejects a request without a bearer token', () => {
    const next = jest.fn();

    authMiddleware(request(undefined), {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, code: 'NO_TOKEN' }));
  });

  test('rejects a malformed or invalid bearer token', () => {
    const next = jest.fn();

    authMiddleware(request('Bearer not-a-jwt'), {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, code: 'INVALID_TOKEN' })
    );
  });

  test('attaches a verified user and continues', () => {
    const token = signAccessToken('user-1', { role: 'traveller' });
    const req = request(`Bearer ${token}`);
    const next = jest.fn();

    authMiddleware(req, {}, next);

    expect(req.user).toMatchObject({ userId: 'user-1', id: 'user-1', role: 'traveller' });
    expect(next).toHaveBeenCalledWith();
  });

  test('admin middleware rejects missing, invalid, and non-admin credentials', () => {
    const cases = [
      [undefined, 'NO_TOKEN'],
      ['Bearer not-a-jwt', 'INVALID_TOKEN'],
      [`Bearer ${signAccessToken('user-1')}`, 'ADMIN_REQUIRED'],
    ];

    for (const [authorization, code] of cases) {
      const next = jest.fn();
      adminAuth(request(authorization), {}, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ code }));
    }
  });

  test('admin middleware accepts both supported admin claims', () => {
    for (const claims of [{ isAdmin: true }, { role: 'admin' }]) {
      const req = request(`Bearer ${signAccessToken('admin-1', claims)}`);
      const next = jest.fn();

      adminAuth(req, {}, next);

      expect(req.user).toMatchObject({ userId: 'admin-1', ...claims });
      expect(next).toHaveBeenCalledWith();
    }
  });
});
