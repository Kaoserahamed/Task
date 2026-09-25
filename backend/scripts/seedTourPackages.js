'use strict';

/**
 * Seed sample tour packages for local/demo environments.
 *
 * Run with: node scripts/seedTourPackages.js
 * The runner is import-safe so fixtures and failure paths can be tested without
 * opening a database connection.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const Tour = require('../models/tours');
const Company = require('../models/company');
const { hashPassword } = require('../utils/password');
const sampleTours = require('./seed-data');

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
];

const requireValue = (name, value) => {
  if (!value) throw new Error(`Missing ${name} environment variable — see backend/.env.example.`);
  return value;
};

const addCompanyToTours = (tours, company, images = DEFAULT_IMAGES) =>
  tours.map((tour) => ({
    ...tour,
    companyId: company._id,
    companyName: company.name,
    images,
  }));

async function findOrCreateDemoCompany({
  email,
  password,
  log = console.log,
  companyModel = Company,
}) {
  let demoCompany = await companyModel.findOne({ email });
  if (demoCompany) {
    log('[seed] Demo company found');
    return demoCompany;
  }

  const hashedPassword = await hashPassword(password);
  demoCompany = await companyModel.create({
    name: 'Demo Travel Company',
    email,
    password: hashedPassword,
    description: 'A demo travel company showcasing tour packages',
    phone: '+880 1234-567890',
    website: 'https://demotravels.com',
    address: '123 Demo Street, Dhaka, Bangladesh',
    isVerified: true,
    verificationStatus: 'approved',
  });
  log('[seed] Demo company created');
  return demoCompany;
}

async function seedTourPackages({
  tours = sampleTours,
  log = console.log,
  uri = process.env.MONGODB_URI,
  email = process.env.DEMO_COMPANY_EMAIL,
  password = process.env.DEMO_COMPANY_PASSWORD,
  database = mongoose,
  tourModel = Tour,
  companyModel = Company,
  images = DEFAULT_IMAGES,
} = {}) {
  requireValue('MONGODB_URI', uri);
  requireValue('DEMO_COMPANY_EMAIL', email);
  requireValue('DEMO_COMPANY_PASSWORD', password);

  log('[seed] Connecting to MongoDB...');
  await database.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
  });
  log('[seed] Connected to MongoDB\n');

  try {
    log('[seed] Finding/Creating demo company...');
    const demoCompany = await findOrCreateDemoCompany({
      email,
      password,
      log,
      companyModel,
    });
    log(`   Company ID: ${demoCompany._id}`);
    log(`   Company Name: ${demoCompany.name}\n`);

    await tourModel.deleteMany({ companyId: demoCompany._id });
    log('[seed] Cleared existing demo tours\n');

    log('[seed] Creating tour packages...');
    const createdTours = await tourModel.insertMany(addCompanyToTours(tours, demoCompany, images));
    log(`[seed] ${createdTours.length} tour packages created\n`);

    return { demoCompany, createdTours };
  } finally {
    await database.disconnect();
  }
}

if (require.main === module) {
  seedTourPackages()
    .then(({ createdTours }) => {
      console.log('------------------------------');
      console.log('[seed] Sample tour packages seeded successfully!');
      console.log('------------------------------\n');
      console.log('[seed] Created tours:');
      createdTours.forEach((tour, index) => {
        console.log(`${index + 1}. ${tour.name}`);
        console.log(`   - Category: ${tour.packageCategories.join(', ')}`);
        console.log(`   - Duration: ${tour.duration.days} days, ${tour.duration.nights} nights`);
        console.log(`   - Price: ৳${tour.price}`);
        console.log(`   - Status: ${tour.status}`);
        console.log('');
      });
      console.log('\n[seed] View these tours in:');
      console.log('   - Frontend: http://localhost:3000');
      console.log('   - Admin Dashboard: http://localhost:3001');
      console.log('   - Company Dashboard: http://localhost:3002\n');
    })
    .catch((error) => {
      console.error('[seed] Error seeding tour packages:', error);
      process.exitCode = 1;
    });
}

module.exports = {
  DEFAULT_IMAGES,
  addCompanyToTours,
  findOrCreateDemoCompany,
  sampleTours,
  seedTourPackages,
};
