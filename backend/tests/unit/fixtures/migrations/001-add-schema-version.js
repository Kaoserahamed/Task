'use strict';

// Fixture: a well-formed migration. `up()` receives the connection and the
// logger; it must be safe to describe without running (no work at require time).
const description = 'add schemaVersion to tours';

async function up({ db }) {
  await db
    .collection('tours')
    .updateMany({ schemaVersion: { $exists: false } }, [{ $set: { schemaVersion: 1 } }]);
}

module.exports = { description, up };
