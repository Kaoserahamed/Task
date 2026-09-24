/**
 * Seed Demo Accounts Script
 * Creates or updates demo accounts for testing purposes
 * Run: node scripts/seedDemoAccounts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { hashPassword } = require('../utils/password');
const User = require('../models/User');
const { Admin, AdminProfile } = require('../models/Admin');
const Company = require('../models/company');
const logger = require('../utils/logger');

// Demo credentials — override via environment variables; never commit real secrets.
// Seed scripts/routes read these same variables so seeded data matches local login hints.
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD;
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_USER_PASSWORD;
const DEMO_COMPANY_PASSWORD = process.env.DEMO_COMPANY_PASSWORD || process.env.DEMO_USER_PASSWORD;
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL;
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL;
const DEMO_COMPANY_EMAIL = process.env.DEMO_COMPANY_EMAIL;

if (!DEMO_USER_EMAIL || !DEMO_ADMIN_EMAIL || !DEMO_COMPANY_EMAIL || !DEMO_USER_PASSWORD) {
  logger.warn('Missing demo account email/password env vars — see backend/.env.example.');
  process.exit(1);
}

const demoAccounts = {
  user: {
    name: 'Demo User',
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    phone: '+1234567890',
  },
  admin: {
    name: 'Demo Admin',
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    role: 'admin',
  },
  company: {
    name: 'Demo Travel Company',
    email: DEMO_COMPANY_EMAIL,
    password: DEMO_COMPANY_PASSWORD,
    description: 'A demo travel company for testing',
    phone: '+1234567890',
    website: 'https://demo-company.com',
    address: '123 Demo Street, Demo City',
  },
};

async function seedDemoAccounts() {
  try {
    // Connect to MongoDB
    logger.info('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    logger.info('✅ Connected to MongoDB\n');

    // Hash password
    const hashedPassword = await hashPassword(demoAccounts.user.password);

    // 1. Create/Update Demo User
    logger.info('👤 Creating/Updating Demo User...');
    const existingUser = await User.findOne({ email: demoAccounts.user.email });

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.name = demoAccounts.user.name;
      existingUser.phone = demoAccounts.user.phone;
      await existingUser.save();
      logger.info('✅ Demo User updated');
    } else {
      await User.create({
        ...demoAccounts.user,
        password: hashedPassword,
      });
      logger.info('✅ Demo User created');
    }
    logger.info(`   📧 Email: ${demoAccounts.user.email}`);
    logger.info('   🔑 Password: (from DEMO_USER_PASSWORD)\n');

    // 2. Create/Update Demo Admin
    logger.info('👨‍💼 Creating/Updating Demo Admin...');
    const existingAdmin = await Admin.findOne({ email: demoAccounts.admin.email });

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      logger.info('✅ Demo Admin updated');

      // Update or create admin profile
      const existingProfile = await AdminProfile.findOne({ adminId: existingAdmin._id });
      if (existingProfile) {
        existingProfile.name = demoAccounts.admin.name;
        await existingProfile.save();
      } else {
        await AdminProfile.create({
          adminId: existingAdmin._id,
          name: demoAccounts.admin.name,
        });
      }
    } else {
      const newAdmin = await Admin.create({
        email: demoAccounts.admin.email,
        password: hashedPassword,
      });

      // Create admin profile
      await AdminProfile.create({
        adminId: newAdmin._id,
        name: demoAccounts.admin.name,
      });

      logger.info('✅ Demo Admin created');
    }
    logger.info(`   📧 Email: ${demoAccounts.admin.email}`);
    logger.info('   🔑 Password: (from DEMO_ADMIN_PASSWORD)\n');

    // 3. Create/Update Demo Company
    logger.info('🏢 Creating/Updating Demo Company...');
    const existingCompany = await Company.findOne({ email: demoAccounts.company.email });

    if (existingCompany) {
      existingCompany.password = hashedPassword;
      existingCompany.name = demoAccounts.company.name;
      existingCompany.description = demoAccounts.company.description;
      existingCompany.phone = demoAccounts.company.phone;
      existingCompany.website = demoAccounts.company.website;
      existingCompany.address = demoAccounts.company.address;
      await existingCompany.save();
      logger.info('✅ Demo Company updated');
    } else {
      await Company.create({
        ...demoAccounts.company,
        password: hashedPassword,
      });
      logger.info('✅ Demo Company created');
    }
    logger.info(`   📧 Email: ${demoAccounts.company.email}`);
    logger.info('   🔑 Password: (from DEMO_COMPANY_PASSWORD)\n');

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🎉 All demo accounts have been created/updated!');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    logger.info('📋 Demo Credentials Summary:');
    logger.info('┌─────────────────────────────────────────┐');
    logger.info('│ 👤 User Account                         │');
    logger.info(`│    Email:    ${demoAccounts.user.email.padEnd(27)}│`);
    logger.info('│    Password: (from DEMO_USER_PASSWORD)    │');
    logger.info('├─────────────────────────────────────────┤');
    logger.info('│ 👨‍💼 Admin Account                        │');
    logger.info(`│    Email:    ${demoAccounts.admin.email.padEnd(27)}│`);
    logger.info('│    Password: (from DEMO_ADMIN_PASSWORD)   │');
    logger.info('├─────────────────────────────────────────┤');
    logger.info('│ 🏢 Company Account                      │');
    logger.info(`│    Email:    ${demoAccounts.company.email.padEnd(27)}│`);
    logger.info('│    Password: (from DEMO_COMPANY_PASSWORD) │');
    logger.info('└─────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding demo accounts:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDemoAccounts();
