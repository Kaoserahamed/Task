'use strict';

module.exports = [
  {
    name: 'Sundarbans Mangrove Forest Adventure',
    packageCategories: ['Adventure', 'Wildlife', 'Nature'],
    tourType: {
      single: false,
      group: true,
    },
    duration: {
      days: 4,
      nights: 3,
    },
    startDate: new Date('2026-11-15T00:00:00.000Z'),
    endDate: new Date('2026-11-18T00:00:00.000Z'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true,
    },
    transportation: {
      type: 'Boat',
      details: 'Traditional wooden boat with sleeping arrangements',
    },
    tourGuide: true,
    price: 12000,
    maxGroupSize: 20,
    availableSeats: 20,
    destinations: [
      {
        name: 'Sundarbans National Park',
        description: 'UNESCO World Heritage Site, home to Royal Bengal Tigers',
        stayDuration: '3 nights',
      },
      {
        name: 'Kotka Beach',
        description: 'Secluded beach surrounded by mangrove forest',
        stayDuration: '4 hours',
      },
      {
        name: 'Jamtola Beach',
        description: 'Beautiful beach with diverse wildlife viewing opportunities',
        stayDuration: '3 hours',
      },
    ],
    includes: [
      'Boat accommodation (3 nights)',
      'All meals on boat',
      'Forest entry permits',
      'Experienced forest guide',
      'Life jackets and safety equipment',
      'Binoculars for wildlife viewing',
    ],
    excludes: [
      'Personal expenses',
      'Camera fees at forest',
      'Alcoholic beverages',
      'Travel to launch terminal',
    ],
    specialNote:
      'This is an adventure tour with basic amenities. Bring mosquito repellent, flashlight, and warm clothes for nights.',
    cancellationPolicy: 'Non-refundable within 15 days of departure due to permit arrangements.',
    status: 'approved',
    weather: {
      city: 'Khulna',
      condition: 'Partly Cloudy',
      temp: 26,
    },
  },
];
