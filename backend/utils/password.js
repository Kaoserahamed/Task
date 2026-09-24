'use strict';

/**
 * Password hashing.
 *
 * One implementation for the whole API: `bcryptjs` (pure JS, no native build
 * step) at a single cost factor, so a hash written by any endpoint can be
 * verified by any other. The native `bcrypt` package used to sit next to it as
 * a second, differently-configured dependency; it is gone, and the repository
 * guard now fails if it comes back.
 *
 * bcryptjs returns a promise when no callback is passed, which is how every
 * caller uses it.
 */

const bcrypt = require('bcryptjs');

/** Key-stretching cost: 2^10 rounds, ~100 ms per hash on the CI machine. */
const HASH_ROUNDS = 10;

/** Hash a plaintext password for storage. */
function hashPassword(plain) {
  return bcrypt.hash(String(plain), HASH_ROUNDS);
}

/**
 * Compare a candidate password with a stored hash.
 *
 * A missing or malformed hash answers `false` instead of throwing: callers turn
 * that into a 401, and the endpoint must not leak *why* the check failed.
 */
async function verifyPassword(plain, hash) {
  if (!plain || typeof hash !== 'string' || hash.length === 0) {
    return false;
  }

  try {
    return await bcrypt.compare(String(plain), hash);
  } catch {
    return false;
  }
}

module.exports = { HASH_ROUNDS, hashPassword, verifyPassword };
