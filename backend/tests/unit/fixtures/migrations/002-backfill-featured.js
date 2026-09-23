'use strict';

// Fixture: no `description` export, so the slug must be used as the label.
async function up({ db }) {
  await db
    .collection('companies')
    .updateMany({ featured: { $exists: false } }, [{ $set: { featured: false } }]);
}

module.exports = { up };
