'use strict';

const Wishlist = require('../../models/Wishlist');

test('declares a unique normalized owner/tour key and a lookup index', () => {
  const indexes = Wishlist.schema.indexes();
  const uniqueOwnerTour = indexes.find(
    ([fields, options]) => fields.email === 1 && fields.tourId === 1 && options.unique === true
  );

  expect(uniqueOwnerTour).toBeDefined();
  expect(Wishlist.schema.path('email').options).toMatchObject({
    lowercase: true,
    trim: true,
  });
  expect(indexes.some(([fields]) => fields.tourId === 1 && fields.createdAt === -1)).toBe(true);
});
