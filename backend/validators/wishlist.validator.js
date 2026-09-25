'use strict';

const { ValidationError } = require('../utils/errors');

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Parse the only client-controlled value in a wishlist request. */
function parseTourId(value) {
  if (typeof value !== 'string' || !OBJECT_ID.test(value.trim())) {
    throw new ValidationError("'tourId' must be a valid tour identifier");
  }
  return value.trim().toLowerCase();
}

module.exports = { parseTourId };
