'use strict';

/**
 * Integration suite bootstrap: a real (throwaway) MongoDB.
 *
 * `mongodb-memory-server` downloads a mongod binary the first time it runs and
 * keeps it in the user cache, so subsequent runs are offline. Set `MONGODB_URI`
 * to reuse a service container instead (see docker-compose.test.yml).
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  const externalUri = process.env.MONGODB_URI_TEST;
  let uri = externalUri;

  if (!uri) {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
}, 120000);

afterEach(async () => {
  const { collections } = mongoose.connection;
  // Each test starts from an empty database: assertions on counts and lists do
  // not have to reason about what a previous test left behind.
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
