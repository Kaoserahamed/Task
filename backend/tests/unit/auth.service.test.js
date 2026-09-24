'use strict';

const { buildService } = require('./support/authServiceStub');

/**
 * Auth business rules.
 *
 * No database, no bcrypt, no mail provider, no clock: the service takes all four
 * as constructor arguments, so every rule below is driven directly. The rules
 * that matter most — no enumeration, token expiry, no credential logging — are
 * asserted explicitly because each one was a live defect.
 */

describe('auth.service', () => {
  describe('register', () => {
    test('hashes the password, stores it and signs the new user in', async () => {
      const { service, users, tokens } = buildService();

      const result = await service.register({
        name: 'Ada',
        email: 'ada@x.io',
        password: 'secret123',
      });

      expect(users.existsByEmail).toHaveBeenCalledWith('ada@x.io');
      expect(users.create).toHaveBeenCalledWith({
        name: 'Ada',
        email: 'ada@x.io',
        password: 'hashed:secret123',
      });
      expect(tokens.signAccessToken).toHaveBeenCalledWith('user-1');
      expect(result.token).toBe('token-for-user-1');
    });

    test('never returns the password hash to the caller', async () => {
      const { service } = buildService({
        users: { create: jest.fn(async (data) => ({ _id: 'u1', password: data.password })) },
      });

      const { user } = await service.register({
        name: 'Ada',
        email: 'ada@x.io',
        password: 'secret123',
      });

      expect(user).not.toHaveProperty('password');
      expect(Object.keys(user).sort()).toEqual(['_id', 'avatar', 'email', 'name', 'phone']);
    });

    test('refuses a duplicate address with a conflict, not a 500', async () => {
      const { service, users } = buildService({
        users: { existsByEmail: jest.fn().mockResolvedValue(true) },
      });

      await expect(
        service.register({ name: 'Ada', email: 'ada@x.io', password: 'secret123' })
      ).rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('returns a token and the public user shape', async () => {
      const { service } = buildService({
        users: {
          findByEmail: jest.fn().mockResolvedValue({
            _id: 'u1',
            name: 'Ada',
            email: 'ada@x.io',
            password: 'hashed:secret123',
          }),
        },
      });

      const result = await service.login({ email: 'ada@x.io', password: 'secret123' });

      expect(result.token).toBe('token-for-u1');
      expect(result.user).toMatchObject({ _id: 'u1', name: 'Ada' });
      expect(result.user).not.toHaveProperty('password');
    });

    test('answers identically for an unknown address and a wrong password', async () => {
      const unknown = buildService({
        users: { findByEmail: jest.fn().mockResolvedValue(null) },
      });
      const wrongPassword = buildService({
        users: {
          findByEmail: jest.fn().mockResolvedValue({ _id: 'u1', password: 'hashed:other' }),
        },
      });

      const shape = (error) => ({
        status: error.status,
        code: error.code,
        message: error.message,
      });
      const fromUnknown = await unknown.service
        .login({ email: 'nobody@x.io', password: 'secret123' })
        .catch(shape);
      const fromWrong = await wrongPassword.service
        .login({ email: 'ada@x.io', password: 'secret123' })
        .catch(shape);

      expect(fromUnknown).toEqual(fromWrong);
      expect(fromUnknown).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    });

    test('still verifies a hash when the account is unknown, so timing does not leak', async () => {
      const { service, passwords } = buildService({
        users: { findByEmail: jest.fn().mockResolvedValue(null) },
      });

      await service.login({ email: 'nobody@x.io', password: 'secret123' }).catch(() => {});

      expect(passwords.verifyPassword).toHaveBeenCalledTimes(1);
      expect(passwords.verifyPassword.mock.calls[0][1]).not.toBe('secret123');
    });
  });

  describe('search', () => {
    test('passes an escaped, case-insensitive pattern to the repository', async () => {
      const { service, users } = buildService();

      await service.search('Ada (');

      const [pattern] = users.searchByName.mock.calls[0];
      expect(pattern.source).toBe('Ada \\(');
      expect(pattern.flags).toContain('i');
    });
  });

  describe('profile', () => {
    test('updates through the repository and returns the public shape', async () => {
      const { service } = buildService({
        users: {
          updateById: jest.fn().mockResolvedValue({ _id: 'u1', name: 'New', email: 'ada@x.io' }),
        },
      });

      const result = await service.updateProfile('u1', { name: 'New' });

      expect(result.user).toMatchObject({ name: 'New' });
      expect(result.user).not.toHaveProperty('password');
    });

    test('reports a missing account as 404 rather than a 500', async () => {
      const { service } = buildService();

      await expect(service.getProfile('ghost')).rejects.toMatchObject({
        status: 404,
        code: 'NOT_FOUND',
      });
    });
  });

  describe('avatar', () => {
    test('writes the avatar of the token owner, not of an address in the body', async () => {
      const { service, users } = buildService({
        users: { setAvatarById: jest.fn().mockResolvedValue({ _id: 'user-1' }) },
      });

      await service.setAvatar('user-1', { avatar: 'uploads/a.png' });

      expect(users.setAvatarById).toHaveBeenCalledWith('user-1', 'uploads/a.png');
    });
  });

  describe('password reset', () => {
    test('stores a token, emails the link and returns the accepted shape', async () => {
      const { service, users, mail, RESET_TOKEN_TTL_MS } = buildService({
        users: { findByEmail: jest.fn().mockResolvedValue({ _id: 'u1' }) },
      });

      const result = await service.requestPasswordReset({
        email: 'ada@x.io',
        resetUrl: 'https://app.test/reset-password',
      });

      expect(users.setResetToken).toHaveBeenCalledWith(
        'ada@x.io',
        'reset-token-abc',
        new Date(1_700_000_000_000 + RESET_TOKEN_TTL_MS)
      );
      expect(mail.sendPasswordReset).toHaveBeenCalledWith({
        to: 'ada@x.io',
        resetUrl: 'https://app.test/reset-password',
        token: 'reset-token-abc',
      });
      expect(result).toEqual({ success: true, message: 'Password reset email sent successfully' });
    });

    test('returns the identical response for an unknown address and sends nothing', async () => {
      const known = buildService({
        users: { findByEmail: jest.fn().mockResolvedValue({ _id: 'u1' }) },
      });
      const unknown = buildService({ users: { findByEmail: jest.fn().mockResolvedValue(null) } });

      const fromKnown = await known.service.requestPasswordReset({
        email: 'ada@x.io',
        resetUrl: 'https://app.test/reset-password',
      });
      const fromUnknown = await unknown.service.requestPasswordReset({
        email: 'nobody@x.io',
        resetUrl: 'https://app.test/reset-password',
      });

      expect(fromUnknown).toEqual(fromKnown);
      expect(unknown.mail.sendPasswordReset).not.toHaveBeenCalled();
      expect(unknown.users.setResetToken).not.toHaveBeenCalled();
    });

    test('never writes the token or the user document to the log', async () => {
      const { service, log } = buildService({
        users: {
          findByEmail: jest.fn().mockResolvedValue({ _id: 'u1', password: 'hashed:secret123' }),
        },
      });

      await service.requestPasswordReset({ email: 'ada@x.io', resetUrl: 'https://app.test' });

      // The log may name the action, but never the token, the hash or the address.
      const logged = log.info.mock.calls.flat().join(' ');
      expect(logged).not.toContain('reset-token-abc');
      expect(logged).not.toContain('hashed:');
      expect(logged).not.toContain('ada@x.io');
    });

    test('sets the new password and burns the token', async () => {
      const { service, users } = buildService({
        users: {
          findOneByResetToken: jest.fn().mockResolvedValue({
            _id: 'u1',
            resetTokenExpiration: new Date(1_700_000_000_000 + 1000),
          }),
        },
      });

      const result = await service.resetPassword({
        token: 'reset-token-abc',
        password: 'newpass123',
      });

      expect(users.setPassword).toHaveBeenCalledWith('u1', 'hashed:newpass123');
      expect(users.clearResetToken).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ success: true });
    });

    test('rejects an expired token instead of accepting it forever', async () => {
      const { service, users } = buildService({
        users: {
          findOneByResetToken: jest.fn().mockResolvedValue({
            _id: 'u1',
            resetTokenExpiration: new Date(1_700_000_000_000 - 1000),
          }),
        },
      });

      await expect(
        service.resetPassword({ token: 'reset-token-abc', password: 'newpass123' })
      ).rejects.toMatchObject({ status: 400, code: 'INVALID_RESET_TOKEN' });
      expect(users.setPassword).not.toHaveBeenCalled();
    });

    test('rejects a token whose expiry is missing', async () => {
      const { service } = buildService({
        users: { findOneByResetToken: jest.fn().mockResolvedValue({ _id: 'u1' }) },
      });

      await expect(
        service.resetPassword({ token: 'reset-token-abc', password: 'newpass123' })
      ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });
    });

    test('rejects an unknown token', async () => {
      const { service, users } = buildService();

      await expect(
        service.resetPassword({ token: 'nope', password: 'newpass123' })
      ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });
      expect(users.setPassword).not.toHaveBeenCalled();
    });
  });
});
