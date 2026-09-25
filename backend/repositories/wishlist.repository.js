'use strict';

const Wishlist = require('../models/Wishlist');

/** The only module that talks to the Wishlist model. */
const wishlistRepository = {
  findByEmail(email) {
    return Wishlist.find({ email }).select('-email').populate('tourId').sort({ createdAt: -1 });
  },

  existsFor(email, tourId) {
    return Wishlist.exists({ email, tourId });
  },

  create(data) {
    return Wishlist.create(data);
  },

  deleteFor(email, tourId) {
    return Wishlist.findOneAndDelete({ email, tourId });
  },
};

module.exports = wishlistRepository;
