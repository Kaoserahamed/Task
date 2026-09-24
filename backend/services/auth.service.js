'use strict';

const crypto = require('crypto');

const userRepository = require('../repositories/user.repository');
const mailService = require('./mail.service');
const logger = require('../utils/logger');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/token');
const {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} = require('../utils/errors');
const { buildSearchPattern, serializeUser } = require('../validators/auth.validator');

/**
 * Authentication and profile business rules.
 *
 * The service knows nothing about HTTP: it receives plain objects, throws typed
 * errors and returns plain data. Its collaborators — the repository, the mailer,
 * the token minter, the clock and the random source — are constructor
 * arguments, so every branch is testable with no database, no mail provider and
 * no sleeping.
 *
 * Three rules are enforced here rather than in the controller, because they are
 * properties of the *domain*, not of the transport:
 *
 *   - **No user enumeration.** Login answers identically for an unknown address
 *     and a wrong password, and the reset endpoint answers identically whether
 *     or not the address exists.
 *   - **Reset tokens expire.** The old code wrote `resetTokenExpiration` and
 *     then never read it, so a leaked reset link stayed valid forever.
 *   - **Credentials are never logged.** The user document (which contains the
 *     password hash) and the reset token stay out of the log entirely.
 */

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * A syntactically valid hash that no password matches, used to spend roughly the
 * same time on an unknown account as on a known one.
 */
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

class AuthService {
  constructor({
    users = userRepository,
    mail = mailService,
    tokens = { signAccessToken },
    passwords = { hashPassword, verifyPassword },
    log = logger,
    now = () => Date.now(),
    randomToken = () => crypto.randomBytes(32).toString('hex'),
  } = {}) {
    this.users = users;
    this.mail = mail;
    this.tokens = tokens;
    this.passwords = passwords;
    this.log = log;
    this.now = now;
    this.randomToken = randomToken;
  }

  /** Register a customer account and sign them straight in. */
  async register({ name, email, password }) {
    if (await this.users.existsByEmail(email)) {
      throw new ConflictError('User already exists', 'EMAIL_TAKEN');
    }

    const passwordHash = await this.passwords.hashPassword(password);
    const user = await this.users.create({ name, email, password: passwordHash });

    return {
      token: this.tokens.signAccessToken(user._id),
      user: serializeUser(user),
    };
  }

  /**
   * Verify credentials. The same `UnauthorizedError` is raised for "no such
   * user" and "wrong password", and a dummy hash is verified when the user is
   * unknown so both paths cost roughly the same.
   */
  async login({ email, password }) {
    const user = await this.users.findByEmail(email);
    const passwordMatches = await this.passwords.verifyPassword(
      password,
      user ? user.password : DUMMY_HASH
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return {
      token: this.tokens.signAccessToken(user._id),
      user: serializeUser(user),
    };
  }

  /** Company directory search. */
  async search(term) {
    return this.users.searchByName(buildSearchPattern(term));
  }

  /** Partial profile update; unknown fields were already dropped by the validator. */
  async updateProfile(userId, patch) {
    const updated = await this.users.updateById(userId, patch);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return { user: serializeUser(updated) };
  }

  async getProfile(userId) {
    const user = await this.users.findByIdWithoutPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return { user: serializeUser(user) };
  }

  /**
   * Set the caller's own avatar.
   *
   * The account is taken from the verified token, never from an address in the
   * request body: the old endpoint updated whoever the body named, so any
   * unauthenticated caller who knew an email could replace that user's picture.
   */
  async setAvatar(userId, { avatar }) {
    const user = await this.users.setAvatarById(userId, avatar);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return { user: serializeUser(user) };
  }

  /**
   * Start a password reset.
   *
   * The response is identical whether the address is registered or not, so this
   * endpoint cannot be used to discover which emails hold accounts. Only the
   * registered case sends mail.
   */
  async requestPasswordReset({ email, resetUrl }) {
    const user = await this.users.findByEmail(email);

    if (user) {
      const token = this.randomToken();
      const expiresAt = new Date(this.now() + RESET_TOKEN_TTL_MS);
      await this.users.setResetToken(email, token, expiresAt);
      await this.mail.sendPasswordReset({ to: email, resetUrl, token });
      this.log.info('Password reset requested for a registered address');
    } else {
      this.log.info('Password reset requested for an unknown address');
    }

    return {
      success: true,
      message: 'Password reset email sent successfully',
    };
  }

  /**
   * Complete a password reset. An unknown, already-used or expired token is
   * rejected the same way, and the token is cleared on success so a link is
   * single-use.
   */
  async resetPassword({ token, password }) {
    const user = await this.users.findOneByResetToken(token);
    const expiresAt = user && user.resetTokenExpiration;
    const isExpired = !expiresAt || new Date(expiresAt).getTime() <= this.now();

    if (!user || isExpired) {
      throw new BadRequestError('Reset link is invalid or has expired', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await this.passwords.hashPassword(password);
    await this.users.setPassword(user._id, passwordHash);
    await this.users.clearResetToken(user._id);

    return { success: true };
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;
module.exports.RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MS;
