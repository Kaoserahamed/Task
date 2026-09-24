'use strict';

/**
 * Run the versioned migrations in `scripts/migrations/`.
 *
 *     node scripts/run-migrations.js --dry-run
 *     node scripts/run-migrations.js
 *
 * This is an operator command, not an endpoint: it needs a real `MONGODB_URI`,
 * it is not part of the boot path, and against a production database it refuses
 * to run unless `MIGRATIONS_ENABLED=true`. See docs/migrations.md.
 */

require('dotenv').config();

const mongoose = require('mongoose');

const config = require('../config/env');
const logger = require('../utils/logger');
const { applyMigrations, loadMigrations } = require('./migrations');

const COLLECTION = '_migrations';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!config.mongodb.uri) {
    logger.error('MONGODB_URI is not set — nothing to migrate');
    process.exitCode = 1;
    return;
  }

  if (config.isProduction && !config.migrations.enabled) {
    logger.error('refusing to migrate a production database without MIGRATIONS_ENABLED=true');
    process.exitCode = 1;
    return;
  }

  const migrations = loadMigrations();
  if (migrations.length === 0) {
    logger.info('scripts/migrations holds no migrations — nothing to do');
    return;
  }

  await mongoose.connect(config.mongodb.uri);
  const collection = mongoose.connection.db.collection(COLLECTION);
  const applied = (await collection.find({}, { projection: { _id: 1 } }).toArray()).map((doc) =>
    String(doc._id)
  );

  logger.info({ applied: applied.length, available: migrations.length }, 'migration state');

  const ran = await applyMigrations({
    available: migrations,
    applied,
    log: (message) => logger.info(message),
    apply: async (migration) => {
      if (dryRun) return;
      await migration.up({ db: mongoose.connection.db, logger });
      // Recorded only after `up()` resolved, so a failed migration is retried
      // on the next run instead of being silently marked as done.
      await collection.insertOne({ _id: migration.id, appliedAt: new Date() });
    },
  });

  if (dryRun) {
    logger.info({ pending: ran.length }, 'dry run — no changes were written');
  } else {
    logger.info({ applied: ran.length }, 'migrations finished');
  }
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'migration failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
