'use strict';

module.exports = [
  {
    name: 'Sylhet Tea Garden & Waterfall Tour',
    packageCategories: ['Nature', 'Relaxation', 'Photography'],
    tourType: {
      single: true,
      group: true,
    },
    duration: {
      days: 3,
      nights: 2,
    },
    startDate: new Date('2026-12-10T00:00:00.000Z'),
    endDate: new Date('2026-12-12T00:00:00.000Z'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true,
    },
    transportation: {
      type: 'AC Minibus',
      details: 'Comfortable AC minibus for group travel',
    },
    tourGuide: true,
    price: 9500,
    maxGroupSize: 25,
    availableSeats: 25,
    destinations: [
      {
        name: 'Jaflong',
        description: 'Crystal clear Piyain River with stone collection sites',
        stayDuration: '4 hours',
      },
      {
        name: 'Ratargul Swamp Forest',
        description: 'Freshwater swamp forest - Amazon of Bangladesh',
        stayDuration: '3 hours',
      },
      {
        name: 'Madhabkunda Waterfall',
        description: 'Largest waterfall in Bangladesh',
        stayDuration: '3 hours',
      },
      {
        name: 'Tea Gardens',
        description: 'Endless green tea plantations with photo opportunities',
        stayDuration: '2 hours',
      },
      {
        name: 'Lalakhal',
        description: 'Blue-green river surrounded by hills',
        stayDuration: '3 hours',
      },
    ],
    includes: [
      'Hotel accommodation (2 nights)',
      'All meals',
      'AC transportation',
      'Professional guide',
      'Boat rides at Ratargul and Lalakhal',
      'Entry fees',
    ],
    excludes: [
      'Personal expenses',
      'Additional boat rides',
      'Shopping at local markets',
      'Tips for boat operators',
    ],
    specialNote:
      'Best season: October to March. Bring rain gear if traveling during monsoon. Swimming is not allowed at waterfall.',
    cancellationPolicy:
      'Full refund 10+ days before. 60% refund 5-10 days. 30% refund 2-5 days. No refund within 48 hours.',
    status: 'approved',
    weather: {
      city: 'Sylhet',
      condition: 'Pleasant',
      temp: 24,
    },
  },
];
