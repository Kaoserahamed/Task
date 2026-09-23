# Database migrations

MongoDB has no schema to alter, so a migration here is a script that transforms
documents once. This page is the operator procedure; the file format lives in
[`backend/scripts/migrations/README.md`](../backend/scripts/migrations/README.md).

## Running them

```bash
cd backend
node scripts/run-migrations.js --dry-run   # list what would run, write nothing
node scripts/run-migrations.js             # apply, then record each id
```

The runner needs a real `MONGODB_URI` and refuses to touch a database when
`NODE_ENV=production` unless `MIGRATIONS_ENABLED=true` — the same "operator
action, explicit flag" policy as seeding. It is not part of the boot path: a
container start never migrates, so a rolling deploy cannot apply the same change
twice.

## What is recorded

| Where         | What                                                      |
| ------------- | --------------------------------------------------------- |
| `_migrations` | one document per applied id: `{ _id: '001', appliedAt }`  |
| the tree      | `scripts/migrations/0NN-slug.js`, ascending, run in order |

The runner is idempotent: the second invocation reports `nothing to apply`. If
the database records an id that is missing from the tree (a migration was
renamed or deleted) it stops with an error instead of applying the rest against
an unreproducible state. A migration whose `up()` throws is not recorded, so it
runs again on the next attempt.

## The schema is versioned in the documents

Long-lived collections carry a `schemaVersion` field. New writes set the current
version; a migration adds it to existing documents (`$exists: false` filter) and
bumps it when the shape changes. Application code can then keep a small
compatibility branch for older versions instead of guessing what it just read —
and the number tells you which migrations are still outstanding.

## Local practice

- `mongoose` connects with the same URI the app uses, so run migration scripts
  against the same `MONGODB_URI` you develop with (or the compose test stack).
- Write migrations so they are safe on a partially migrated collection: filter
  on the missing field, never assume every document looks the same.
- Add the migration in the same pull request as the code that depends on it, and
  mention both in `CHANGELOG.md`.

## Rolling back

There is no `down()`. A rollback is a new migration that restores the previous
shape, which keeps the history append-only and reproducible:

1. Write `0NN-restore-<thing>.js` that reverses the change (the old value is
   reproducible from the data, or was captured in a backup).
2. Deploy the code that expects the old shape first, then run the migration.
3. If the change is destructive (drops a field or a collection), take a
   `mongodump` of the affected collections before applying it — that dump is the
   only rollback that works without a script.
