'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Backend layering contract (C1.1 / C1.6).
 *
 * The rule the whole refactor exists to enforce: `route → validate → controller →
 * service → repository`, with **repositories as the only code that touches
 * Mongoose**. When a route queries the database directly, the business rule is
 * welded to the HTTP request, so it cannot be tested without a server, reused by
 * a script, or changed without reading the request handler.
 *
 * This is a *ratchet*, the same technique the coverage floors use. The auth and
 * tour domains have been migrated; the domains listed below have not. Rather than
 * pretending the repository is clean, the guard pins the exact remaining set so
 * that:
 *
 *   - a **new** file that imports a model fails the suite immediately, and
 *   - a file that gets migrated also fails, until its name is removed from this
 *     list in the same commit that fixed it.
 *
 * The list can therefore only shrink, and it cannot be quietly widened.
 */

const backendRoot = path.resolve(__dirname, '..', '..', '..');

/**
 * Domains that still query Mongoose outside a repository. Empty the list as each
 * one is layered; the ratchet test below fails the moment an entry no longer
 * applies, so it cannot rot.
 */
const MODEL_IMPORT_EXEMPTIONS = new Map([
  ['routes/companyRoutes.js', 'company approval and profile — 428-line route'],
  ['routes/bookingRoutes.js', 'booking lifecycle'],
  ['routes/reviewRoutes.js', 'customer reviews and moderation'],
  ['routes/adminauth.js', 'admin login and profile'],
  ['routes/dashboardRoutes.js', 'admin dashboard aggregate queries'],
  ['routes/wishlistRoutes.js', 'wishlist items per user'],
  ['routes/seedRoutes.js', 'local seeding, already behind SEED_ENABLED'],
  ['routes/demoAccounts.js', 'local demo accounts, already behind SEED_ENABLED'],
  ['controllers/chat.js', 'chat controller still queries Chat and Message'],
  ['controllers/placeController.js', 'hotel and restaurant lookups'],
  ['controllers/weatherController.js', 'weather proxy'],
  ['controllers/SuggestionController.js', 'tour suggestions'],
]);

function listBackendFiles(dir = backendRoot) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'coverage', 'build', 'tests', 'scripts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listBackendFiles(full));
    } else if (entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const relative = (file) => path.relative(backendRoot, file).split(path.sep).join('/');
const read = (file) => fs.readFileSync(file, 'utf8');

const MODEL_IMPORT = /require\(\s*['"][^'"]*\/models\/[^'"]+['"]\s*\)/;
const REPOSITORY_IMPORT = /require\(\s*['"][^'"]*\/repositories\/[^'"]+['"]\s*\)/;
const HTTP_IN_SERVICE = /require\(\s*['"]express['"]\s*\)|\b(req|res|next)\s*\./;

describe('backend layering contract', () => {
  const sourceFiles = listBackendFiles().map((file) => ({ file, name: relative(file) }));

  const modelImporters = (predicate) =>
    sourceFiles
      .filter((entry) => predicate(entry.name))
      .filter((entry) => MODEL_IMPORT.test(read(entry.file)))
      .map((entry) => entry.name);

  test('repositories are the only layer that imports a Mongoose model', () => {
    const offenders = modelImporters((name) => !name.startsWith('repositories/'))
      .filter((name) => !MODEL_IMPORT_EXEMPTIONS.has(name))
      .sort();

    expect(offenders).toEqual([]);
  });

  test('ratchet: the exemption list is exactly the set of unmigrated files', () => {
    const actual = modelImporters((name) => !name.startsWith('repositories/'));

    // Every entry must still be a real offender: migrating a file without
    // deleting its entry fails here, which is what keeps the list honest.
    const stale = [...MODEL_IMPORT_EXEMPTIONS.keys()]
      .filter((name) => !actual.includes(name))
      .sort();
    // Every offender must be listed: a new violation fails here.
    const undeclared = actual.filter((name) => !MODEL_IMPORT_EXEMPTIONS.has(name)).sort();

    expect({ stale, undeclared }).toEqual({ stale: [], undeclared: [] });
  });

  test('every exemption names the reason it is still pending', () => {
    const actual = modelImporters(() => true);
    for (const [name, reason] of MODEL_IMPORT_EXEMPTIONS) {
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(10);
      expect(actual).toContain(name);
    }
  });

  test('services never see the HTTP layer or a model', () => {
    const httpOffenders = sourceFiles
      .filter((entry) => entry.name.startsWith('services/'))
      .filter((entry) => HTTP_IN_SERVICE.test(read(entry.file)))
      .map((entry) => entry.name);

    expect(httpOffenders).toEqual([]);
    expect(modelImporters((name) => name.startsWith('services/'))).toEqual([]);
  });

  test('controllers reach the database through a service, never a repository', () => {
    const offenders = sourceFiles
      .filter((entry) => entry.name.startsWith('controllers/'))
      .filter((entry) => REPOSITORY_IMPORT.test(read(entry.file)))
      .map((entry) => entry.name);

    expect(offenders).toEqual([]);
  });

  test('the repository layer exists for every migrated domain', () => {
    // A domain that claims to be layered but has no repository is not layered.
    for (const domain of ['tour', 'user']) {
      expect(
        sourceFiles.some((entry) => entry.name === `repositories/${domain}.repository.js`)
      ).toBe(true);
    }
  });
});
