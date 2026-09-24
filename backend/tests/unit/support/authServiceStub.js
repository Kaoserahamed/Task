'use strict';

/**
 * Test double for the auth service collaborators.
 *
 * Not a *.test.js file, so Jest never treats it as a suite: it only provides the
 * in-memory repository / mailer / token minter / clock the service specs drive.
 * Nothing here touches MongoDB, bcrypt or a mail provider.
 */
function buildService(overrides = {}) {
  const { AuthService, RESET_TOKEN_TTL_MS } = require('../../../services/auth.service');

  const users = {
    create: jest.fn(async (data) => ({ _id: 'user-1', avatar: 'default.png', ...data })),
    existsByEmail: jest.fn().mockResolvedValue(false),
    findByEmail: jest.fn().mockResolvedValue(null),
    findByIdWithoutPassword: jest.fn().mockResolvedValue(null),
    searchByName: jest.fn().mockResolvedValue([]),
    updateById: jest.fn().mockResolvedValue(null),
    setAvatarById: jest.fn().mockResolvedValue(null),
    setResetToken: jest.fn().mockResolvedValue(null),
    findOneByResetToken: jest.fn().mockResolvedValue(null),
    clearResetToken: jest.fn().mockResolvedValue(null),
    setPassword: jest.fn().mockResolvedValue(null),
    ...overrides.users,
  };

  const mail = { sendPasswordReset: jest.fn().mockResolvedValue({ sent: true }) };
  const tokens = { signAccessToken: jest.fn((userId) => `token-for-${userId}`) };
  const passwords = {
    hashPassword: jest.fn(async (plain) => `hashed:${plain}`),
    verifyPassword: jest.fn(async (plain, hash) => hash === `hashed:${plain}`),
  };
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const now = overrides.now || (() => 1_700_000_000_000);
  const randomToken = overrides.randomToken || (() => 'reset-token-abc');

  const service = new AuthService({
    users,
    mail,
    tokens,
    passwords,
    log,
    now,
    randomToken,
  });

  return { service, users, mail, tokens, passwords, log, now, RESET_TOKEN_TTL_MS };
}

module.exports = { buildService };
