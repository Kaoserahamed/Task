const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  email: {
    // Store user's email instead of userId
    type: String,
    required: true,
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
