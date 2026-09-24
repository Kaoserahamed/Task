# Migrations

Numbered, operator-run scripts that change data. See
[`docs/migrations.md`](../../../docs/migrations.md) for the procedure and the
rollback story.

## Adding one

1. Copy the template below to `backend/scripts/migrations/0NN-short-slug.js`,
   using the next free three-digit number.
2. Write `up({ db, logger })` so that it is safe on a partially migrated
   database: query for the documents that still need the change instead of
   assuming the whole collection looks one way.
3. Log what you changed (`logger.info({ modified: result.modifiedCount }, '…')`).
4. Run it against a local database — `node scripts/run-migrations.js --dry-run`
   first, then for real — and commit the file in the same pull request as the
   code that depends on it.

Never rename, renumber or delete a migration that has been applied: the
`_migrations` collection stores the id, and the runner refuses to start when a
recorded id is missing from the tree.

## Template

```js
'use strict';

const description = 'add schemaVersion to every tour';

async function up({ db, logger }) {
  const result = await db
    .collection('tours')
    .updateMany({ schemaVersion: { $exists: false } }, [{ $set: { schemaVersion: 1 } }]);

  logger.info({ modified: result.modifiedCount }, description);
}

module.exports = { description, up };
```

## Contract

- A file must be named `<three digits>-<slug>.js` and export `up` — the loader
  ignores anything else and fails on a numbered file without `up`.
- Migrations run in ascending id order, one at a time, and the id is recorded
  only after `up()` resolves, so a failure is retried on the next run rather
  than skipped.
- `loadMigrations`, `planMigrations` and `applyMigrations`
  (`scripts/migrations/index.js`) are pure and unit-tested
  (`tests/unit/migrations.test.js`); only `scripts/run-migrations.js` opens a
  connection.
