/**
 * Seed Sample Tour Packages Script
 * Creates sample tour packages for testing
 * Run: node scripts/seedTourPackages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tour = require('../models/tours');
const Company = require('../models/company');

const sampleTours = [
  {
    name: 'Amazing Cox\'s Bazar Beach Tour',
    packageCategories: ['Beach', 'Relaxation'],
    tourType: {
      single: true,
      group: true
    },
    duration: {
      days: 3,
      nights: 2
    },
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-03'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true
    },
    transportation: {
      type: 'AC Bus',
      details: 'Comfortable AC bus with reclining seats'
    },
    tourGuide: true,
    price: 8500,
    maxGroupSize: 40,
    availableSeats: 40,
    destinations: [
      {
        name: 'Cox\'s Bazar Beach',
        description: 'World\'s longest natural sea beach with stunning sunset views',
        stayDuration: '2 nights'
      },
      {
        name: 'Inani Beach',
        description: 'Pristine beach with crystal clear water and coral stones',
        stayDuration: '4 hours'
      },
      {
        name: 'Himchari National Park',
        description: 'Scenic waterfalls and lush green hills',
        stayDuration: '3 hours'
      }
    ],
    includes: [
      'Hotel accommodation (2 nights)',
      'All meals (breakfast, lunch, dinner)',
      'AC transportation',
      'Professional tour guide',
      'Entry fees to all attractions',
      'Travel insurance'
    ],
    excludes: [
      'Personal expenses',
      'Water sports activities',
      'Additional snacks and beverages',
      'Tips and gratuities'
    ],
    specialNote: 'Bring comfortable walking shoes, sunscreen, and swimwear. Swimming is allowed under supervision.',
    cancellationPolicy: 'Free cancellation up to 7 days before departure. 50% refund for 3-7 days, no refund within 3 days.',
    status: 'approved',
    weather: {
      city: 'Cox\'s Bazar',
      condition: 'Sunny',
      temp: 28
    }
  },
  {
    name: 'Sundarbans Mangrove Forest Adventure',
    packageCategories: ['Adventure', 'Wildlife', 'Nature'],
    tourType: {
      single: false,
      group: true
    },
    duration: {
      days: 4,
      nights: 3
    },
    startDate: new Date('2026-11-15'),
    endDate: new Date('2026-11-18'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true
    },
    transportation: {
      type: 'Boat',
      details: 'Traditional wooden boat with sleeping arrangements'
    },
    tourGuide: true,
    price: 12000,
    maxGroupSize: 20,
    availableSeats: 20,
    destinations: [
      {
        name: 'Sundarbans National Park',
        description: 'UNESCO World Heritage Site, home to Royal Bengal Tigers',
        stayDuration: '3 nights'
      },
      {
        name: 'Kotka Beach',
        description: 'Secluded beach surrounded by mangrove forest',
        stayDuration: '4 hours'
      },
      {
        name: 'Jamtola Beach',
        description: 'Beautiful beach with diverse wildlife viewing opportunities',
        stayDuration: '3 hours'
      }
    ],
    includes: [
      'Boat accommodation (3 nights)',
      'All meals on boat',
      'Forest entry permits',
      'Experienced forest guide',
      'Life jackets and safety equipment',
      'Binoculars for wildlife viewing'
    ],
    excludes: [
      'Personal expenses',
      'Camera fees at forest',
      'Alcoholic beverages',
      'Travel to launch terminal'
    ],
    specialNote: 'This is an adventure tour with basic amenities. Bring mosquito repellent, flashlight, and warm clothes for nights.',
    cancellationPolicy: 'Non-refundable within 15 days of departure due to permit arrangements.',
    status: 'approved',
    weather: {
      city: 'Khulna',
      condition: 'Partly Cloudy',
      temp: 26
    }
  },
  {
    name: 'Sajek Valley Hill Trek',
    packageCategories: ['Mountain', 'Adventure', 'Trekking'],
    tourType: {
      single: true,
      group: true
    },
    duration: {
      days: 2,
      nights: 1
    },
    startDate: new Date('2026-09-20'),
    endDate: new Date('2026-09-21'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true
    },
    transportation: {
      type: 'Jeep',
      details: 'Local 4WD jeep for hilly terrain'
    },
    tourGuide: true,
    price: 6500,
    maxGroupSize: 15,
    availableSeats: 15,
    destinations: [
      {
        name: 'Sajek Valley',
        description: 'Highest peak in Rangamati with breathtaking cloud views',
        stayDuration: '1 night'
      },
      {
        name: 'Konglak Hill',
        description: 'Panoramic viewpoint for sunrise and sunset',
        stayDuration: '2 hours'
      },
      {
        name: 'Ruilui Para',
        description: 'Traditional tribal village with cultural experience',
        stayDuration: '2 hours'
      }
    ],
    includes: [
      'Cottage accommodation',
      'All meals (local cuisine)',
      'Jeep transportation',
      'Local guide',
      'Bonfire evening',
      'Tribal cultural program'
    ],
    excludes: [
      'Dhaka to Khagrachari transport',
      'Personal expenses',
      'Photography at tribal areas (requires permission)',
      'Adventure activities like zip-lining'
    ],
    specialNote: 'Roads are challenging. Not recommended for those with motion sickness or heart conditions. Mobile network is limited.',
    cancellationPolicy: 'Full refund if cancelled 5+ days before. 50% refund for 2-5 days. No refund within 48 hours.',
    status: 'approved',
    weather: {
      city: 'Rangamati',
      condition: 'Misty',
      temp: 22
    }
  },
  {
    name: 'Historical Dhaka City Tour',
    packageCategories: ['Historical', 'Cultural', 'City'],
    tourType: {
      single: true,
      group: true
    },
    duration: {
      days: 1,
      nights: 0
    },
    meals: {
      breakfast: false,
      lunch: true,
      dinner: false
    },
    transportation: {
      type: 'AC Car',
      details: 'Private AC car with professional driver'
    },
    tourGuide: true,
    price: 2500,
    destinations: [
      {
        name: 'Lalbagh Fort',
        description: 'Mughal fort from 17th century with stunning architecture',
        stayDuration: '1.5 hours'
      },
      {
        name: 'Ahsan Manzil',
        description: 'Pink Palace - Historic nawab residence',
        stayDuration: '1 hour'
      },
      {
        name: 'Sadarghat River Terminal',
        description: 'Bustling river port with colorful boats',
        stayDuration: '45 minutes'
      },
      {
        name: 'Star Mosque',
        description: 'Beautiful mosque with star-studded mosaic decorations',
        stayDuration: '30 minutes'
      },
      {
        name: 'Dhakeshwari Temple',
        description: 'National Hindu temple with rich history',
        stayDuration: '45 minutes'
      }
    ],
    includes: [
      'AC car transportation',
      'Professional guide',
      'Lunch at traditional restaurant',
      'Entry fees to all monuments',
      'Bottled water'
    ],
    excludes: [
      'Breakfast and dinner',
      'Shopping expenses',
      'Boat ride at Sadarghat',
      'Photography fees at some locations'
    ],
    specialNote: 'Comfortable walking shoes recommended. Modest dress required for religious sites.',
    cancellationPolicy: 'Free cancellation up to 24 hours before tour. No refund for same-day cancellation.',
    status: 'approved',
    weather: {
      city: 'Dhaka',
      condition: 'Warm',
      temp: 32
    }
  },
  {
    name: 'Sylhet Tea Garden & Waterfall Tour',
    packageCategories: ['Nature', 'Relaxation', 'Photography'],
    tourType: {
      single: true,
      group: true
    },
    duration: {
      days: 3,
      nights: 2
    },
    startDate: new Date('2026-12-10'),
    endDate: new Date('2026-12-12'),
    meals: {
      breakfast: true,
      lunch: true,
      dinner: true
    },
    transportation: {
      type: 'AC Minibus',
      details: 'Comfortable AC minibus for group travel'
    },
    tourGuide: true,
    price: 9500,
    maxGroupSize: 25,
    availableSeats: 25,
    destinations: [
      {
        name: 'Jaflong',
        description: 'Crystal clear Piyain River with stone collection sites',
        stayDuration: '4 hours'
      },
      {
        name: 'Ratargul Swamp Forest',
        description: 'Freshwater swamp forest - Amazon of Bangladesh',
        stayDuration: '3 hours'
      },
      {
        name: 'Madhabkunda Waterfall',
        description: 'Largest waterfall in Bangladesh',
        stayDuration: '3 hours'
      },
      {
        name: 'Tea Gardens',
        description: 'Endless green tea plantations with photo opportunities',
        stayDuration: '2 hours'
      },
      {
        name: 'Lalakhal',
        description: 'Blue-green river surrounded by hills',
        stayDuration: '3 hours'
      }
    ],
    includes: [
      'Hotel accommodation (2 nights)',
      'All meals',
      'AC transportation',
      'Professional guide',
      'Boat rides at Ratargul and Lalakhal',
      'Entry fees'
    ],
    excludes: [
      'Personal expenses',
      'Additional boat rides',
      'Shopping at local markets',
      'Tips for boat operators'
    ],
    specialNote: 'Best season: October to March. Bring rain gear if traveling during monsoon. Swimming is not allowed at waterfall.',
    cancellationPolicy: 'Full refund 10+ days before. 60% refund 5-10 days. 30% refund 2-5 days. No refund within 48 hours.',
    status: 'approved',
    weather: {
      city: 'Sylhet',
      condition: 'Pleasant',
      temp: 24
    }
  }
];

async function seedTourPackages() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find or create a demo company
    console.log('🏢 Finding/Creating demo company...');
    let demoCompany = await Company.findOne({ email: 'company@demo.com' });
    
    if (!demoCompany) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('demo123', salt);
      
      demoCompany = await Company.create({
        name: 'Demo Travel Company',
        email: 'company@demo.com',
        password: hashedPassword,
        description: 'A demo travel company showcasing tour packages',
        phone: '+880 1234-567890',
        website: 'https://demotravels.com',
        address: '123 Demo Street, Dhaka, Bangladesh',
        isVerified: true,
        verificationStatus: 'approved'
      });
      console.log('✅ Demo company created');
    } else {
      console.log('✅ Demo company found');
    }
    console.log(`   Company ID: ${demoCompany._id}`);
    console.log(`   Company Name: ${demoCompany.name}\n`);

    // Delete existing demo tours to avoid duplicates
    await Tour.deleteMany({ companyId: demoCompany._id });
    console.log('🗑️  Cleared existing demo tours\n');

    // Add company info to all tours
    const toursWithCompany = sampleTours.map(tour => ({
      ...tour,
      companyId: demoCompany._id,
      companyName: demoCompany.name,
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
      ]
    }));

    // Insert tours
    console.log('📦 Creating tour packages...');
    const createdTours = await Tour.insertMany(toursWithCompany);
    console.log(`✅ ${createdTours.length} tour packages created\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Sample tour packages seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Created Tours:');
    createdTours.forEach((tour, index) => {
      console.log(`${index + 1}. ${tour.name}`);
      console.log(`   - Category: ${tour.packageCategories.join(', ')}`);
      console.log(`   - Duration: ${tour.duration.days} days, ${tour.duration.nights} nights`);
      console.log(`   - Price: ৳${tour.price}`);
      console.log(`   - Status: ${tour.status}`);
      console.log('');
    });

    console.log('\n💡 You can now view these tours in:');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - Admin Dashboard: http://localhost:3001');
    console.log('   - Company Dashboard: http://localhost:3002\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding tour packages:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTourPackages();
