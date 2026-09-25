'use strict';

module.exports = [
  {
    name: 'Sajek Valley Hill Trek',
    packageCategories: ['Mountain', 'Adventure', 'Trekking'],
    tourType: {
      single: true,
      group: true,
    },
    duration: {
      days: 2,
      nights: 1,
    },
    startDate: new Date('2026-09-20T00:00:00.000Z'),
    endDate: new Date('2026-09-21T00:00:00.000Z'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true,
    },
    transportation: {
      type: 'Jeep',
      details: 'Local 4WD jeep for hilly terrain',
    },
    tourGuide: true,
    price: 6500,
    maxGroupSize: 15,
    availableSeats: 15,
    destinations: [
      {
        name: 'Sajek Valley',
        description: 'Highest peak in Rangamati with breathtaking cloud views',
        stayDuration: '1 night',
      },
      {
        name: 'Konglak Hill',
        description: 'Panoramic viewpoint for sunrise and sunset',
        stayDuration: '2 hours',
      },
      {
        name: 'Ruilui Para',
        description: 'Traditional tribal village with cultural experience',
        stayDuration: '2 hours',
      },
    ],
    includes: [
      'Cottage accommodation',
      'All meals (local cuisine)',
      'Jeep transportation',
      'Local guide',
      'Bonfire evening',
      'Tribal cultural program',
    ],
    excludes: [
      'Dhaka to Khagrachari transport',
      'Personal expenses',
      'Photography at tribal areas (requires permission)',
      'Adventure activities like zip-lining',
    ],
    specialNote:
      'Roads are challenging. Not recommended for those with motion sickness or heart conditions. Mobile network is limited.',
    cancellationPolicy:
      'Full refund if cancelled 5+ days before. 50% refund for 2-5 days. No refund within 48 hours.',
    status: 'approved',
    weather: {
      city: 'Rangamati',
      condition: 'Misty',
      temp: 22,
    },
  },
];
