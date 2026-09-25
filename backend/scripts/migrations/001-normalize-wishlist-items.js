'use strict';

const description = 'normalize wishlist ownership keys and remove duplicate items';

async function up({ db, logger }) {
  const wishlists = db.collection('wishlists');
  const normalized = await wishlists.updateMany({ email: { $type: 'string' } }, [
    { $set: { email: { $toLower: { $trim: { input: '$email' } } } } },
  ]);

  const duplicateGroups = await wishlists
    .aggregate([
      { $sort: { createdAt: 1, _id: 1 } },
      {
        $group: {
          _id: { email: '$email', tourId: '$tourId' },
          duplicateIds: { $push: '$_id' },
        },
      },
      { $match: { 'duplicateIds.1': { $exists: true } } },
    ])
    .toArray();

  let removed = 0;
  for (const group of duplicateGroups) {
    const result = await wishlists.deleteMany({ _id: { $in: group.duplicateIds.slice(1) } });
    removed += result.deletedCount;
  }

  const existingIndexes = await wishlists.indexes();
  const legacyOwnerTourIndex = existingIndexes.find(
    (index) => index.key?.email === 1 && index.key?.tourId === 1 && !index.unique
  );
  if (legacyOwnerTourIndex) {
    await wishlists.dropIndex(legacyOwnerTourIndex.name);
  }

  logger.info(
    {
      normalized: normalized.modifiedCount,
      removed,
      duplicateGroups: duplicateGroups.length,
      droppedLegacyIndex: legacyOwnerTourIndex?.name || null,
    },
    'wishlist keys normalized and duplicates removed'
  );
}

module.exports = { description, up };
