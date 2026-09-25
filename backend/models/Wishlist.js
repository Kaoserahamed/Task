const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  email: {
    // Normalize ownership keys so casing cannot create duplicate wishlist rows.
    type: String,
    required: true,
    lowercase: true,
    trim: true,
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

wishlistSchema.index({ email: 1, tourId: 1 }, { unique: true });
wishlistSchema.index({ tourId: 1, createdAt: -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
