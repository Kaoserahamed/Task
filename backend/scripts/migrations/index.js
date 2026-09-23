'use strict';

/**
 * Versioned MongoDB migrations.
 *
 * The database is schemaless, so "changing the schema" means transforming
 * documents. Anything that has to happen once — adding a `schemaVersion` field,
 * renaming a key, backfilling a computed value — is written as a numbered
 * module in this directory and applied by an operator:
 *
 *     node scripts/run-migrations.js --dry-run   # what would run
 *     node scripts/run-migrations.js             # run it
 *
 * Files are `<three digits>-<slug>.js` and export `{ description, up }`. The
 * list of ids already applied lives in the `_migrations` collection, so the
 * runner is idempotent: running it twice applies nothing the second time, and
 * removing or renaming a migration file is reported as an error instead of
 * silently losing the change.
 *
 * This module has no MongoDB dependency on purpose: the ordering and the
 * "already applied" logic are pure functions with unit tests, and the CLI in
 * `../run-migrations.js` is the only place that touches a connection.
 */

const fs = require('fs');
const path = require('path');

const FILE_PATTERN = /^(\d{3})-([a-z0-9-]+)\.js$/;

/** Read the migration modules from a directory, in ascending id order. */
function loadMigrations(dir = __dirname) {
  const files = fs.readdirSync(dir).filter((name) => FILE_PATTERN.test(name));

  return files
    .map((file) => {
      const [, id, slug] = file.match(FILE_PATTERN);
      const mod = require(path.join(dir, file));
      if (typeof mod.up !== 'function') {
        throw new Error(`migration ${file} must export an up() function`);
      }
      return { id, slug, description: mod.description || slug, up: mod.up };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Which migrations still have to run.
 *
 * Throws when the database knows about a migration the tree does not contain:
 * that means someone renamed or deleted an applied script, and continuing would
 * apply the rest against a state nobody can reproduce.
 */
function planMigrations({ available, applied }) {
  const appliedIds = new Set(applied);
  const availableIds = new Set(available.map((migration) => migration.id));

  const unknown = applied.filter((id) => !availableIds.has(id)).sort();
  if (unknown.length > 0) {
    throw new Error(
      `the database records migrations that are not in this tree: ${unknown.join(', ')} — ` +
        'restore the files (renaming an applied migration is not allowed)'
    );
  }

  return available
    .filter((migration) => !appliedIds.has(migration.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Apply everything pending, in order, stopping at the first failure.
 *
 * `apply` is supplied by the caller (the CLI records the id after a successful
 * `up()`), which keeps this function testable with an in-memory fake.
 */
async function applyMigrations({ available, applied, apply, log = () => {} }) {
  const pending = planMigrations({ available, applied });
  const done = [];

  for (const migration of pending) {
    log(`applying ${migration.id}-${migration.slug} — ${migration.description}`);
    // Sequential on purpose: migration 002 may assume the shape 001 produced.
    await apply(migration);
    done.push(migration.id);
  }

  if (done.length === 0) {
    log('nothing to apply — the database is up to date');
  }

  return done;
}

module.exports = { FILE_PATTERN, applyMigrations, loadMigrations, planMigrations };
