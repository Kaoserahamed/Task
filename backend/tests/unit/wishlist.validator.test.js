'use strict';

const { parseTourId } = require('../../validators/wishlist.validator');

const TOUR_ID = '64b7f2c4a1b2c3d4e5f60718';

describe('wishlist input validation', () => {
  test('accepts and normalizes a MongoDB tour identifier', () => {
    expect(parseTourId(` ${TOUR_ID.toUpperCase()} `)).toBe(TOUR_ID);
  });

  test.each([undefined, null, '', 'tour-1', '123', `${TOUR_ID}0`])(
    'rejects %p before a repository call',
    (value) => {
      expect(() => parseTourId(value)).toThrow("'tourId' must be a valid tour identifier");
    }
  );
});
