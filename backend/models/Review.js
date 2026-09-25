// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
  photos: [
    {
      type: String,
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.index({ tourId: 1, date: -1 });
reviewSchema.index({ userName: 1, date: -1 });

module.exports = mongoose.model('Review', reviewSchema);
