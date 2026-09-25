'use strict';

module.exports = [
  {
    name: "Amazing Cox's Bazar Beach Tour",
    packageCategories: ['Beach', 'Relaxation'],
    tourType: {
      single: true,
      group: true,
    },
    duration: {
      days: 3,
      nights: 2,
    },
    startDate: new Date('2026-10-01T00:00:00.000Z'),
    endDate: new Date('2026-10-03T00:00:00.000Z'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true,
    },
    transportation: {
      type: 'AC Bus',
      details: 'Comfortable AC bus with reclining seats',
    },
    tourGuide: true,
    price: 8500,
    maxGroupSize: 40,
    availableSeats: 40,
    destinations: [
      {
        name: "Cox's Bazar Beach",
        description: "World's longest natural sea beach with stunning sunset views",
        stayDuration: '2 nights',
      },
      {
        name: 'Inani Beach',
        description: 'Pristine beach with crystal clear water and coral stones',
        stayDuration: '4 hours',
      },
      {
        name: 'Himchari National Park',
        description: 'Scenic waterfalls and lush green hills',
        stayDuration: '3 hours',
      },
    ],
    includes: [
      'Hotel accommodation (2 nights)',
      'All meals (breakfast, lunch, dinner)',
      'AC transportation',
      'Professional tour guide',
      'Entry fees to all attractions',
      'Travel insurance',
    ],
    excludes: [
      'Personal expenses',
      'Water sports activities',
      'Additional snacks and beverages',
      'Tips and gratuities',
    ],
    specialNote:
      'Bring comfortable walking shoes, sunscreen, and swimwear. Swimming is allowed under supervision.',
    cancellationPolicy:
      'Free cancellation up to 7 days before departure. 50% refund for 3-7 days, no refund within 3 days.',
    status: 'approved',
    weather: {
      city: "Cox's Bazar",
      condition: 'Sunny',
      temp: 28,
    },
  },
];
