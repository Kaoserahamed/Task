// Update Tour Schema
const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  packageCategories: [
    {
      type: String,
      required: true,
      set: (value) => value.replace(/["']/g, ''), // Remove quotes when saving
    },
  ],
  customCategory: {
    type: String,
  },
  tourType: {
    single: {
      type: Boolean,
      default: false,
    },
    group: {
      type: Boolean,
      default: false,
    },
  },
  duration: {
    days: {
      type: Number,
      required: true,
      min: 1,
    },
    nights: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  startDate: {
    type: Date,
    required: function () {
      return this.packageType === 'Group';
    },
  },
  endDate: {
    type: Date,
    required: function () {
      return this.packageType === 'Group';
    },
  },
  meals: {
    breakfast: {
      type: Boolean,
      default: false,
    },
    lunch: {
      type: Boolean,
      default: false,
    },
    dinner: {
      type: Boolean,
      default: false,
    },
  },
  transportation: {
    type: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
  },
  tourGuide: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    required: true,
  },
  maxGroupSize: {
    type: Number,
    required: function () {
      return this.packageType === 'Group';
    },
  },
  availableSeats: {
    type: Number,
    required: function () {
      return this.packageType === 'Group';
    },
  },
  destinations: [
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      stayDuration: {
        type: String,
        required: true,
      },
    },
  ],
  images: [
    {
      type: String, // This will store the image file paths
      required: true,
    },
  ],
  includes: [
    {
      type: String,
    },
  ],
  excludes: [
    {
      type: String,
    },
  ],
  specialNote: {
    type: String,
  },
  cancellationPolicy: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
  },
  review: {
    type: String,
    default: null,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'company',
  },
  companyName: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  popularity: {
    bookings: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    wishlistCount: {
      type: Number,
      default: 0,
    },
  },
  weather: {
    city: {
      type: String,
      required: false, // or true if weather is always expected
    },
    condition: {
      type: String,
      required: false, // or true if weather is always expected
    },
    temp: {
      type: Number,
      required: false,
    },
  },
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
