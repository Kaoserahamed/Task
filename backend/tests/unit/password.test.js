'use strict';

const { HASH_ROUNDS, hashPassword, verifyPassword } = require('../../utils/password');

/**
 * One hashing implementation, one cost factor, no native build step.
 *
 * The regression these specs exist for: `bcrypt` and `bcryptjs` used to live
 * side by side in the manifest, so a hash written by the company endpoint was
 * produced by a different library (and, at one call site, a different cost)
 * than the one that verified it.
 */
describe('utils/password', () => {
  // Hashing is deliberately slow (~100 ms at cost 10); hash once and reuse.
  let hash;

  beforeAll(async () => {
    hash = await hashPassword('correct horse battery staple');
  });

  it('hashes at the documented cost with a per-password salt', async () => {
    expect(HASH_ROUNDS).toBe(10);
    expect(hash).toMatch(/^\$2[aby]\$10\$/);

    const second = await hashPassword('correct horse battery staple');
    expect(second).not.toBe(hash);
  });

  it('never stores or returns the plaintext', () => {
    expect(hash).not.toContain('correct horse');
  });

  it('verifies the right password and rejects everything else', async () => {
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(verifyPassword('Correct horse battery staple', hash)).resolves.toBe(false);
    await expect(verifyPassword('', hash)).resolves.toBe(false);
  });

  it('answers false for missing or malformed hashes instead of throwing', async () => {
    await expect(verifyPassword('secret', undefined)).resolves.toBe(false);
    await expect(verifyPassword('secret', '')).resolves.toBe(false);
    await expect(verifyPassword('secret', 'not-a-bcrypt-hash')).resolves.toBe(false);
  });

  it('hashes non-string input safely', async () => {
    const numeric = await hashPassword(1234567);
    await expect(verifyPassword('1234567', numeric)).resolves.toBe(true);
  });
});
