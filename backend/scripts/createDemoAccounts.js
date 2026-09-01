/**
 * Script to create demo accounts for Company and User
 * Run: node scripts/createDemoAccounts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

// Demo account credentials
const DEMO_COMPANY = {
  name: 'Adventure Tours Ltd',
  email: 'demo@adventuretours.com',
  password: 'demo123',
  phone: '+1-555-0100',
  address: '123 Travel Street, New York, NY 10001',
  website: 'https://adventuretours.com',
  description: 'Premier adventure tour company offering exciting experiences worldwide. Specializing in mountain treks, beach getaways, and cultural tours.',
  isVerified: true,
  verificationStatus: 'approved',
  ownerName: 'John Adventure',
  ownerEmail: 'john@adventuretours.com',
  ownerPhone: '+1-555-0101',
  ownerAddress: '123 Travel Street, New York, NY 10001',
  registrationNumber: 'TOUR-2024-001',
  taxId: 'TAX-123456789',
  licenseNumber: 'LIC-ADV-2024',
  licenseExpiry: new Date('2026-12-31'),
};

const DEMO_USER = {
  name: 'Demo User',
  email: 'user@demo.com',
  password: 'demo123',
  phone: '+1-555-0200',
};

async function createDemoAccounts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create Demo Company
    console.log('👔 Creating Demo Company Account...');
    const existingCompany = await Company.findOne({ email: DEMO_COMPANY.email });
    
    if (existingCompany) {
      console.log('⚠️  Demo company already exists');
      console.log(`   Email: ${DEMO_COMPANY.email}`);
      console.log(`   Company ID: ${existingCompany._id}\n`);
    } else {
      const hashedCompanyPassword = await bcrypt.hash(DEMO_COMPANY.password, 12);
      const company = new Company({
        ...DEMO_COMPANY,
        password: hashedCompanyPassword,
      });
      
      await company.save();
      console.log('✅ Demo company created successfully!');
      console.log(`   Email: ${DEMO_COMPANY.email}`);
      console.log(`   Password: ${DEMO_COMPANY.password}`);
      console.log(`   Company ID: ${company._id}\n`);
    }

    // Create Demo User
    console.log('👤 Creating Demo User Account...');
    const existingUser = await User.findOne({ email: DEMO_USER.email });
    
    if (existingUser) {
      console.log('⚠️  Demo user already exists');
      console.log(`   Email: ${DEMO_USER.email}`);
      console.log(`   User ID: ${existingUser._id}\n`);
    } else {
      const hashedUserPassword = await bcrypt.hash(DEMO_USER.password, 12);
      const user = new User({
        ...DEMO_USER,
        password: hashedUserPassword,
      });
      
      await user.save();
      console.log('✅ Demo user created successfully!');
      console.log(`   Email: ${DEMO_USER.email}`);
      console.log(`   Password: ${DEMO_USER.password}`);
      console.log(`   User ID: ${user._id}\n`);
    }

    console.log('═══════════════════════════════════════════════');
    console.log('DEMO CREDENTIALS SUMMARY');
    console.log('═══════════════════════════════════════════════');
    console.log('\n📋 COMPANY LOGIN:');
    console.log(`   Email: ${DEMO_COMPANY.email}`);
    console.log(`   Password: ${DEMO_COMPANY.password}`);
    console.log(`   URL: https://company-yourapp.vercel.app/login`);
    
    console.log('\n📋 USER LOGIN:');
    console.log(`   Email: ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}`);
    console.log(`   URL: https://frontend-blue-sigma-62.vercel.app/login`);
    console.log('\n═══════════════════════════════════════════════\n');

    console.log('✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
    process.exit(1);
  }
}

// Run the script
createDemoAccounts();
