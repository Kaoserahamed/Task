'use strict';

module.exports = [
  {
    name: 'Historical Dhaka City Tour',
    packageCategories: ['Historical', 'Cultural', 'City'],
    tourType: {
      single: true,
      group: true,
    },
    duration: {
      days: 1,
      nights: 0,
    },
    meals: {
      breakfast: false,
      lunch: true,
      dinner: false,
    },
    transportation: {
      type: 'AC Car',
      details: 'Private AC car with professional driver',
    },
    tourGuide: true,
    price: 2500,
    destinations: [
      {
        name: 'Lalbagh Fort',
        description: 'Mughal fort from 17th century with stunning architecture',
        stayDuration: '1.5 hours',
      },
      {
        name: 'Ahsan Manzil',
        description: 'Pink Palace - Historic nawab residence',
        stayDuration: '1 hour',
      },
      {
        name: 'Sadarghat River Terminal',
        description: 'Bustling river port with colorful boats',
        stayDuration: '45 minutes',
      },
      {
        name: 'Star Mosque',
        description: 'Beautiful mosque with star-studded mosaic decorations',
        stayDuration: '30 minutes',
      },
      {
        name: 'Dhakeshwari Temple',
        description: 'National Hindu temple with rich history',
        stayDuration: '45 minutes',
      },
    ],
    includes: [
      'AC car transportation',
      'Professional guide',
      'Lunch at traditional restaurant',
      'Entry fees to all monuments',
      'Bottled water',
    ],
    excludes: [
      'Breakfast and dinner',
      'Shopping expenses',
      'Boat ride at Sadarghat',
      'Photography fees at some locations',
    ],
    specialNote:
      'Comfortable walking shoes recommended. Modest dress required for religious sites.',
    cancellationPolicy:
      'Free cancellation up to 24 hours before tour. No refund for same-day cancellation.',
    status: 'approved',
    weather: {
      city: 'Dhaka',
      condition: 'Warm',
      temp: 32,
    },
  },
];
