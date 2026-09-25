'use strict';

const mongoose = require('mongoose');

/**
 * Run a unit of work in a MongoDB/DocumentDB transaction. Callers receive the
 * same session and must pass it to every query in the unit.
 */
async function runInTransaction(work) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { runInTransaction };
