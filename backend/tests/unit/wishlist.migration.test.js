'use strict';

const migration = require('../../scripts/migrations/001-normalize-wishlist-items');

test('normalizes historical ownership keys and removes only later duplicates', async () => {
  const collection = {
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
    aggregate: jest.fn().mockReturnValue({
      toArray: jest
        .fn()
        .mockResolvedValue([
          { duplicateIds: ['oldest-id', 'newer-id', 'newest-id'] },
          { duplicateIds: ['other-oldest-id', 'other-newer-id'] },
        ]),
    }),
    deleteMany: jest
      .fn()
      .mockResolvedValueOnce({ deletedCount: 2 })
      .mockResolvedValueOnce({ deletedCount: 1 }),
    indexes: jest
      .fn()
      .mockResolvedValue([
        { name: 'email_1_tourId_1', key: { email: 1, tourId: 1 }, unique: false },
      ]),
    dropIndex: jest.fn().mockResolvedValue({ ok: 1 }),
  };
  const db = { collection: jest.fn().mockReturnValue(collection) };
  const logger = { info: jest.fn() };

  await migration.up({ db, logger });

  expect(db.collection).toHaveBeenCalledWith('wishlists');
  expect(collection.updateMany).toHaveBeenCalledWith({ email: { $type: 'string' } }, [
    { $set: { email: { $toLower: { $trim: { input: '$email' } } } } },
  ]);
  expect(collection.deleteMany).toHaveBeenNthCalledWith(1, {
    _id: { $in: ['newer-id', 'newest-id'] },
  });
  expect(collection.deleteMany).toHaveBeenNthCalledWith(2, {
    _id: { $in: ['other-newer-id'] },
  });
  expect(collection.dropIndex).toHaveBeenCalledWith('email_1_tourId_1');
  expect(logger.info).toHaveBeenCalledWith(
    expect.objectContaining({
      normalized: 2,
      removed: 3,
      duplicateGroups: 2,
      droppedLegacyIndex: 'email_1_tourId_1',
    }),
    expect.stringContaining('wishlist keys')
  );
});

test('is safe when the collection has no duplicates', async () => {
  const collection = {
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    deleteMany: jest.fn(),
    indexes: jest.fn().mockResolvedValue([]),
  };

  await migration.up({ db: { collection: () => collection }, logger: { info: jest.fn() } });

  expect(collection.deleteMany).not.toHaveBeenCalled();
});
